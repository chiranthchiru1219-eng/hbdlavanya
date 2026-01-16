const express = require('express');
const os = require('os');
const path = require('path');
const https = require('https');
const fs = require('fs');

const debug = require('debug')('app:server');
const debugError = require('debug')('app:error');

const app = express();
// Use port from environment variable for deployment, or 3000 for local dev
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// --- SSL Options for local HTTPS ---
const keyPath = path.join(__dirname, 'key.pem');
const certPath = path.join(__dirname, 'cert.pem');
const sslOptions = {
  key: null,
  cert: null
};

let useHttps = false;
if (!isProduction && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  sslOptions.key = fs.readFileSync(keyPath);
  sslOptions.cert = fs.readFileSync(certPath);
  useHttps = true;
}

// In development, log all requests to help debug missing files
if (!isProduction) {
  app.use((req, res, next) => {
    debug(`Request: ${req.method} ${req.url}`);
    next();
  });
}

// Serve static files from the current directory
app.use(express.static(__dirname));

// Redirect root to the main html file
app.get('/', (req, res) => {
  res.redirect('/lavanya.html');
});

function startServer() {
  const protocol = useHttps ? 'https' : 'http';

  if (!isProduction) {
    const qrcode = require('qrcode-terminal');

    // Helper to get local IP address
    function getLocalIP() {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            if (!name.toLowerCase().includes('vethernet') &&
                !name.toLowerCase().includes('wsl') &&
                !name.toLowerCase().includes('docker')) {
              return iface.address;
            }
          }
        }
      }
      return 'localhost';
    }

    const ip = getLocalIP();
    const url = `${protocol}://${ip}:${port}/lavanya.html`;

    debug(`Server is in DEVELOPMENT mode.`);
    debug(`Serving files from: ${__dirname}`);
    console.log(`Local:     ${protocol}://localhost:${port}/lavanya.html`);
    console.log(`Network:   ${url}`);

    if (useHttps) {
      console.log('\nRunning in HTTPS mode. You may need to accept the self-signed certificate in your browser.');
    } else {
      console.log('\nRunning in HTTP mode. For HTTPS, generate a self-signed certificate with:');
      console.log('openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes');
    }

    console.log(`\nScan the QR code to view on your phone (must be on the same Wi-Fi):`);
    qrcode.generate(url, { small: true });

    // Try to expose via localtunnel for global access (Any Network)
    if (!useHttps) {
      try {
        const localtunnel = require('localtunnel');
        localtunnel({ port: port }).then(tunnel => {
          console.log(`\n--- GLOBAL ACCESS (Any Network) ---`);
          console.log(`Public URL: ${tunnel.url}/lavanya.html`);
          console.log(`Scan this QR code to view from mobile data or remote networks:`);
          qrcode.generate(`${tunnel.url}/lavanya.html`, { small: true });
        }).catch(err => {
          debugError('Error starting localtunnel:', err);
        });
      } catch (e) {
        console.log('\nTo access from ANY network (Internet), run:');
        console.log('npm install');
      }
    } else {
      console.log('\nNote: Global sharing is disabled in HTTPS mode.');
      console.log('To share over the internet, remove key.pem and cert.pem to switch to HTTP.');
    }
  } else {
    debug('Server is in PRODUCTION mode.');
  }
}

if (useHttps) {
  https.createServer(sslOptions, app).listen(port, () => {
    debug(`HTTPS server is running on port ${port}`);
    startServer();
  });
} else {
  app.listen(port, () => {
    debug(`HTTP server is running on port ${port}`);
    startServer();
  });
}