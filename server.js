// server.js

// Import necessary modules
const http = require('http'); // For creating the HTTP server
const fs = require('fs');     // For file system operations (reading index.html)
const path = require('path');   // For working with file and directory paths

// Define the port the server will listen on.
// It will use the PORT environment variable provided by Render,
// or default to 3000 if that variable is not set (e.g., for local development).
const PORT = process.env.PORT || 3000;

// Read the content of index.html synchronously into a variable.
// This is done once when the server starts.
// path.join(__dirname, 'index.html') creates a platform-independent path to index.html
// located in the same directory as server.js.
const HTML_CONTENT = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Set headers to prevent caching.
  // This ensures the browser always fetches the latest version of the page,
  // which can be useful for maintenance pages or during development.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache'); // HTTP 1.0 backward compatibility
  res.setHeader('Expires', '0'); // Proxies
  res.setHeader('Surrogate-Control', 'no-store'); // Edge Caching

  // Respond to all requests with the HTML content.
  res.writeHead(200, { 'Content-Type': 'text/html' }); // Send HTTP status 200 (OK) and set content type
  res.end(HTML_CONTENT); // Send the HTML content and close the connection
});

// Start the server and make it listen for incoming requests.
// IMPORTANT CHANGE FOR RENDER: Listen on host '0.0.0.0'.
// This tells the server to listen on all available IPv4 network interfaces
// within the container, which is crucial for Render's port detection and routing.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}, listening on host 0.0.0.0`);
});
