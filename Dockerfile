# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy everything including node_modules
COPY . .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
