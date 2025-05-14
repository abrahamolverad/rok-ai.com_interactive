const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HTML_CONTENT = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const server = http.createServer((req, res) => {
  // Set cache-busting headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Serve the HTML content
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(HTML_CONTENT);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});