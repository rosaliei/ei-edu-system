# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (with longer timeout and verbose logging)
RUN npm install --omit=dev --verbose --fetch-timeout=60000 || \
    npm install --omit=dev --fetch-timeout=60000

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
