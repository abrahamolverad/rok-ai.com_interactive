# Use a lightweight Node.js Alpine image as the base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files for the simple server
# It's assumed that server.js and index.html are in the root of your
# pure-html-site branch, or adjust the source path if they are in a subdirectory.
COPY server.js .
COPY index.html .

# Expose the port the server will listen on.
# Your server.js uses process.env.PORT || 3000, so Render will set this.
# This EXPOSE instruction is good practice but Render handles port mapping based on your server's actual listening.
EXPOSE 3000 

# Command to run your server.
# This will execute the server.js script using Node.
CMD ["node", "server.js"]
