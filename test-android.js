/**
 * Android Testing Script
 * 
 * This script helps test the game on Android devices by:
 * 1. Building the game for production
 * 2. Starting a local server to serve the game
 * 3. Providing instructions for testing on Android
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Build the game
console.log('Building the game for production...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error.message}`);
    return;
  }
  
  console.log('Build completed successfully.');
  
  // Start a simple HTTP server
  const PORT = 8080;
  const localIP = getLocalIP();
  
  const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
      filePath = './android-test.html';
    }
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
    }
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          fs.readFile('./404.html', function(error, content) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          });
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${error.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
  
  server.listen(PORT, () => {
    console.log(`\n=== Android Testing Server ===`);
    console.log(`Server running at:`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://${localIP}:${PORT}`);
    console.log(`\nTo test on Android:`);
    console.log(`1. Make sure your Android device is on the same WiFi network as this computer`);
    console.log(`2. Open the browser on your Android device`);
    console.log(`3. Navigate to: http://${localIP}:${PORT}`);
    console.log(`4. Or scan this QR code (if you have a QR code scanner):`);
    console.log(`\nPress Ctrl+C to stop the server`);
  });
});
