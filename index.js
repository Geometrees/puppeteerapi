const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/get-stream-url', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://ww5.123moviesfree.net/season/american-housewife-season-1-17065/', { waitUntil: 'networkidle2' });

    let streamUrl = null;
    page.on('request', request => {
      const url = request.url();
      if (url.match(/\.(m3u8|mp4|mpd)/)) {
        streamUrl = url;
      }
    });

    // Use modern wait
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (streamUrl) {
      res.json({ streamUrl });
    } else {
      res.status(404).json({ error: 'Stream URL not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
