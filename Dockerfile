FROM node:22-alpine

# Install Chromium via Alpine package manager
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    dbus \
    xvfb

# Verify Chromium installation
RUN chromium-browser --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies WITHOUT downloading Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install

# Copy app files
COPY . .

# Tell Puppeteer where to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose port
EXPOSE 10000

# Start app
CMD ["node", "index.js"]