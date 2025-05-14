# Use an official Node.js runtime as a parent image.
# Alpine Linux is a good choice for small image sizes.
FROM node:20-alpine

# Set the working directory in the container.
WORKDIR /app

# Copy package.json and package-lock.json (if it exists).
# This step benefits from Docker's layer caching.
COPY package*.json ./

# Install only production dependencies.
# npm ci is generally preferred for CI/CD environments if you have a package-lock.json
# as it provides more deterministic builds.
# If package-lock.json is not present or you prefer npm install:
RUN npm install --only=production

# Copy the rest of your application's source code into the Docker image.
# This includes your server.js and index.html (assuming they are in the root).
# If server.js or index.html are in a subdirectory (e.g., 'src'),
# you would adjust the COPY command (e.g., COPY src/server.js . and COPY src/index.html .).
COPY . .

# Your server.js is configured to use process.env.PORT or fall back to 3000.
# EXPOSE informs Docker that the container listens on the specified network ports at runtime.
# This is good practice for documentation but doesn't affect Render's port detection directly,
# as Render relies on the PORT environment variable your app binds to.
EXPOSE 3000

# Render will set the PORT environment variable. Your server.js already handles this.
# No need to set ENV PORT here as Render will provide it.

# Define the command to run your application.
CMD [ "node", "server.js" ]
