import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Check if the image already exists
const checkImageExists = async () => {
    try {
        const { stdout } = await execPromise('docker images -q vercel-builder');
        return stdout.trim().length > 0;
    } catch (e) {
        return false;
    }
};

// Build the custom builder image only if it doesn't exist
// We do this synchronously at startup which is fine
if (!fs.existsSync(path.resolve('..', 'Dockerfile'))) {
    console.error('Error: Dockerfile not found in root directory.');
} else {
    try {
        const imageExists = await checkImageExists();
        if (!imageExists) {
            console.log('Building base builder image (one-time setup)...');
            await execPromise('docker build -t vercel-builder .', { cwd: path.resolve('..') });
        } else {
            console.log('Base builder image "vercel-builder" found. Skipping build.');
        }
    } catch (e) {
        console.warn('Warning: Could not check or build Docker image at startup. Docker might be busy.');
    }
}

export async function runBuild(deploymentId, repoUrl) {
    const outputDir = path.resolve(`./builds/${deploymentId}`);
    
    // Ensure output directory exists and is empty
    if (fs.existsSync(outputDir)) {
        try {
            fs.rmSync(outputDir, { recursive: true, force: true });
        } catch (e) {
            console.warn(`Warning: Could not remove old build dir ${outputDir}. Attempting to clean with sudo/docker.`);
            await execPromise(`docker run --rm -v "${path.resolve('./builds')}:/builds" alpine rm -rf "/builds/${deploymentId}"`);
        }
    }
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\n--- Starting Build [${deploymentId}] ---`);
    console.log(`Repo: ${repoUrl}`);

    const userId = (await execPromise('id -u')).stdout.trim();
    const groupId = (await execPromise('id -g')).stdout.trim();

    return new Promise((resolve, reject) => {
        // Use spawn instead of execSync to keep the event loop non-blocking
        const buildProcess = spawn('docker', [
            'run', '--rm',
            '--network', 'host',
            '-v', `${outputDir}:/output`,
            'vercel-builder',
            'sh', '-c', `
                echo 'Cloning repository...' && \
                git clone ${repoUrl} . && \
                if [ ! -f package.json ]; then \
                    echo 'ERROR: package.json not found at the root of the repository!' && exit 1; \
                fi && \
                echo 'Installing dependencies (with retries and legacy-peer-deps)...' && \
                npm install \
                    --legacy-peer-deps \
                    --no-audit \
                    --no-fund \
                    --loglevel error \
                    --fetch-retries=10 \
                    --fetch-retry-mintimeout=20000 \
                    --fetch-retry-maxtimeout=120000 && \
                echo 'Running build command...' && \
                npm run build && \
                if [ -d dist ]; then \
                    echo 'Copying dist/ to host...' && \
                    cp -r dist/* /output/; \
                elif [ -d build ]; then \
                    echo 'Copying build/ to host...' && \
                    cp -r build/* /output/; \
                else \
                    echo 'ERROR: No dist/ or build/ folder found!' && exit 1; \
                fi && \
                echo 'Fixing permissions...' && \
                chown -R ${userId}:${groupId} /output
            `
        ], { stdio: 'inherit' });

        buildProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`\n--- Build Success [${deploymentId}] ---`);
                resolve(true);
            } else {
                console.error(`\n--- Build Failed [${deploymentId}] with code ${code} ---`);
                reject(new Error(`Build failed with exit code ${code}`));
            }
        });

        buildProcess.on('error', (err) => {
            console.error(`\n--- Process Error [${deploymentId}] ---`);
            reject(err);
        });
    });
}