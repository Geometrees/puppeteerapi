FROM node:22-alpine

# Install Chromium and necessary dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all other files
COPY . .

# Set Puppeteer to use Chromium installed by apk
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose app port
EXPOSE 10000

# Start app
CMD ["node", "index.js"]
