# Use official Node.js image with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy rest of the code
COPY . .

# Expose port (same as app)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
