FROM node:22-alpine

# Update package index
RUN apk update

# Install Chromium and dependencies with verbose output
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Debug: Find where Chromium is actually installed
RUN echo "=== CHROMIUM DEBUGGING ===" && \
    echo "Searching for Chromium executables:" && \
    find / -name "*chromium*" -type f -executable 2>/dev/null | head -20 && \
    echo "Checking common paths:" && \
    ls -la /usr/bin/chromium* 2>/dev/null || echo "No chromium* in /usr/bin/" && \
    ls -la /usr/lib/chromium* 2>/dev/null || echo "No chromium* in /usr/lib/" && \
    echo "Checking if chromium-browser command works:" && \
    which chromium-browser || echo "chromium-browser not found in PATH" && \
    echo "Checking if chromium command works:" && \
    which chromium || echo "chromium not found in PATH" && \
    echo "Chromium version (if available):" && \
    (chromium-browser --version 2>/dev/null || chromium --version 2>/dev/null || echo "Cannot get chromium version") && \
    echo "=== END DEBUGGING ==="

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy app files
COPY . .

# Don't set PUPPETEER_EXECUTABLE_PATH yet - we'll detect it at runtime

# Expose port
EXPOSE 10000

# Start app
CMD ["node", "index.js"]