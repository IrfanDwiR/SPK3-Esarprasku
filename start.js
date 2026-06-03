const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[32m%s\x1b[0m', '🚀 STARTING REACT FRONTEND & BACKEND SERVER CONCURRENTLY');
console.log('\x1b[36m%s\x1b[0m', '==================================================');

// 1. Start the React Frontend Dev Server (inside frontend folder)
console.log('🔄 Starting React Frontend Webpack Dev Server...');
const frontendProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    shell: true,
    stdio: 'inherit'
});

frontendProcess.on('exit', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    process.exit(code || 0);
});

// 2. Start the Backend using nodemon (inside backend folder)
console.log('🔄 Starting Backend Server (Express)...');
const backendProcess = spawn('npx', ['nodemon', 'backend/index.js'], { 
    shell: true,
    stdio: 'inherit' 
});

backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    process.exit(code || 0);
});
