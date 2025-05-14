# Render Deployment Instructions for rok-ai.com Interactive Website

This document provides step-by-step instructions for deploying the interactive redesign of rok-ai.com to Render.

## Prerequisites
- A Render account (your existing account)
- MongoDB Atlas account (for the contact form database)

## Deployment Steps

### 1. Create a MongoDB Atlas Database (if you don't already have one)
1. Log in to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier is sufficient)
3. Set up database access user with password
4. Add your IP to the IP Access List (or allow access from anywhere for development)
5. Get your connection string (it will look like: `mongodb+srv://username:password@cluster0.mongodb.net/database`)

### 2. Deploy to Render
1. Log in to your Render account
2. Click "New" and select "Web Service"
3. Connect your GitHub repository or select "Upload Files"
4. If uploading files, upload the entire contents of this deployment package
5. Configure the service:
   - Name: rok-ai-interactive
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Starter (or higher if needed)
6. Add the following environment variables:
   - `NODE_ENV`: production
   - `MONGODB_URI`: Your MongoDB connection string from step 1

### 3. Connect Your Domain
1. Once the service is deployed, go to the "Settings" tab
2. Scroll down to "Custom Domains"
3. Add your domain: rok-ai.com
4. Follow Render's instructions to update your DNS settings if needed

### 4. Verify Deployment
1. Visit your Render URL to ensure the site is working correctly
2. Test the interactive features
3. Submit a test contact form to verify the MongoDB connection

## Troubleshooting
- If you encounter build errors, check the build logs in Render
- If the 3D elements don't load, ensure your browser supports WebGL
- For MongoDB connection issues, verify your connection string and network access settings

## Additional Information
- The site uses client-side rendering for 3D elements to ensure compatibility
- The contact form is configured to store submissions in MongoDB
- All interactive elements are optimized for both desktop and mobile devices
