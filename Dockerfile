FROM node:22-alpine

# Update Alpine and install basic dependencies
RUN apk update && apk upgrade

# Install Chromium and ALL its dependencies
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    wqy-zenhei \
    # Additional dependencies that might be missing
    udev \
    ttf-opensans \
    libstdc++ \
    # X11 libraries for headless mode
    xvfb \
    # Additional libraries
    libxrandr \
    libxdamage \
    libxcomposite \
    libxss \
    libgconf-2-4 \
    libnss3-dev \
    libxrender1 \
    libxext6 \
    libxi6 \
    libgbm-dev

# Force create symlinks and verify installation
RUN echo "Creating Chromium symlinks..." && \
    mkdir -p /usr/bin && \
    # Create multiple symlinks to cover all possible names
    ln -sf /usr/bin/chromium-browser /usr/bin/chromium 2>/dev/null || true && \
    ln -sf /usr/bin/chromium /usr/bin/chromium-browser 2>/dev/null || true && \
    ln -sf /usr/bin/chromium-browser /usr/bin/google-chrome 2>/dev/null || true && \
    # Make sure the main executable exists and is executable
    chmod +x /usr/bin/chromium-browser 2>/dev/null || true && \
    chmod +x /usr/bin/chromium 2>/dev/null || true

# Final verification - this will FAIL the build if Chromium isn't working
RUN echo "=== FINAL CHROMIUM VERIFICATION ===" && \
    echo "Checking if chromium-browser exists:" && \
    ls -la /usr/bin/chromium* && \
    echo "Testing chromium-browser command:" && \
    /usr/bin/chromium-browser --version || \
    (echo "CHROMIUM INSTALLATION FAILED!" && exit 1)

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies (skip Puppeteer's Chromium download)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install

# Copy app files
COPY . .

# Set the Chromium path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create a startup script to verify Chromium at runtime
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "=== RUNTIME CHROMIUM CHECK ==="' >> /app/start.sh && \
    echo 'ls -la /usr/bin/chromium*' >> /app/start.sh && \
    echo '/usr/bin/chromium-browser --version' >> /app/start.sh && \
    echo 'echo "=== STARTING NODE APP ==="' >> /app/start.sh && \
    echo 'exec node index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 10000

# Use the startup script
CMD ["/app/start.sh"]