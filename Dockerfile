FROM node:20-alpine

WORKDIR /app

# Copy files
COPY index.html server.js ./

# Expose port
EXPOSE 10000

# Start the server
CMD ["node", "server.js"]