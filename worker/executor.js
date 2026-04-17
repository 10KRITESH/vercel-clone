import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Build the custom builder image once when the script starts (optional but recommended)
console.log('Building base builder image...');
try {
  execSync('docker build -t vercel-builder .', { stdio: 'inherit', cwd: path.resolve('..') });
} catch (e) {
  console.error('Failed to build builder image. Make sure Docker is running.');
}

export async function runBuild(deploymentId, repoUrl) {
    const outputDir = path.resolve(`./builds/${deploymentId}`);
    
    // Ensure output directory exists and is empty
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\n--- Starting Build [${deploymentId}] ---`);
    console.log(`Repo: ${repoUrl}`);

    try {
        // Run the build inside the container
        // We mount the outputDir to /output in the container
        execSync(`
            docker run --rm \
            -v "${outputDir}:/output" \
            vercel-builder \
            sh -c "
                echo 'Cloning repository...' && \
                git clone ${repoUrl} . && \
                if [ ! -f package.json ]; then \
                    echo 'ERROR: package.json not found at the root of the repository!' && exit 1; \
                fi && \
                echo 'Installing dependencies...' && \
                npm install && \
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
                fi
            "
        `, { stdio: 'inherit' });

        console.log(`\n--- Build Success [${deploymentId}] ---`);
        return true;
    } catch (error) {
        console.error(`\n--- Build Failed [${deploymentId}] ---`);
        throw error;
    }
}