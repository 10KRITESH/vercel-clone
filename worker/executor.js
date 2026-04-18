import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Check if the image already exists
const checkImageExists = () => {
    try {
        const output = execSync('docker images -q vercel-builder').toString().trim();
        return output.length > 0;
    } catch (e) {
        return false;
    }
};

// Build the custom builder image only if it doesn't exist
if (!checkImageExists()) {
    console.log('Building base builder image (one-time setup)...');
    try {
        execSync('docker build -t vercel-builder .', { 
            stdio: 'inherit', 
            cwd: path.resolve('..')
        });
    } catch (e) {
        console.error('Failed to build builder image. Make sure Docker is running.');
    }
} else {
    console.log('Base builder image "vercel-builder" found. Skipping build.');
}

export async function runBuild(deploymentId, repoUrl) {
    const outputDir = path.resolve(`./builds/${deploymentId}`);
    
    // Ensure output directory exists and is empty
    if (fs.existsSync(outputDir)) {
        try {
            fs.rmSync(outputDir, { recursive: true, force: true });
        } catch (e) {
            console.warn(`Warning: Could not remove old build dir ${outputDir}. Attempting to clean with sudo/docker.`);
            execSync(`docker run --rm -v "${path.resolve('./builds')}:/builds" alpine rm -rf "/builds/${deploymentId}"`);
        }
    }
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\n--- Starting Build [${deploymentId}] ---`);
    console.log(`Repo: ${repoUrl}`);

    const userId = execSync('id -u').toString().trim();
    const groupId = execSync('id -g').toString().trim();

    try {
        // Run the build inside the container
        execSync(`
            docker run --rm \
            --network host \
            -v "${outputDir}:/output" \
            vercel-builder \
            sh -c "
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
            "
        `, { stdio: 'inherit' });

        console.log(`\n--- Build Success [${deploymentId}] ---`);
        return true;
    } catch (error) {
        console.error(`\n--- Build Failed [${deploymentId}] ---`);
        throw error;
    }
}