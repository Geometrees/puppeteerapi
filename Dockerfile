FROM ghcr.io/puppeteer/puppeteer:22.12.0

# Switch to root to install additional packages
USER root

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip chromium download since it's already included)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install

# Copy app files
COPY . .

# Switch back to pptruser
USER pptruser

EXPOSE 10000

CMD ["node", "index.js"]