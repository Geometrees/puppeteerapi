const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

// Health check route for Render
app.get('/', (req, res) => res.send('OK'));

// Main API route
app.get('/get-stream-url', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const page = await browser.newPage();

    // Log every request the page makes
    let streamUrl = null;
    page.on('request', request => {
      const url = request.url();
      console.log('Request:', url);  // This will appear in Render logs

      if (url.match(/\.(m3u8|mp4|mpd)/)) {
        console.log('Matched stream URL:', url);
        streamUrl = url;
      }
    });

    // Go to the target page
    await page.goto('https://ww5.123moviesfree.net/season/american-housewife-season-1-17065/', {
      waitUntil: 'networkidle2'
    });

    // Wait longer for requests to happen (10 seconds)
    await new Promise(resolve => setTimeout(resolve, 10000));

    if (streamUrl) {
      res.json({ streamUrl });
    } else {
      res.status(404).json({ error: 'Stream URL not found' });
    }

  } catch (err) {
    console.error('Error in /get-stream-url:', err);
    res.status(500).json({ error: err.toString() });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Bind to Render-provided port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
