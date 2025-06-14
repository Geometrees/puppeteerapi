const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/get-stream-url', async (req, res) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    let videoURL = null;

    page.on('request', request => {
      const url = request.url();
      if (url.endsWith('.m3u8') || url.endsWith('.mp4') || url.endsWith('.mpd')) {
        videoURL = url;
      }
    });

    await page.goto('https://ww5.123moviesfree.net/season/american-housewife-season-1-17065/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.video-option');
    const buttons = await page.$$('.video-option');

    const index = parseInt(req.query.index || 0);
    if (buttons[index]) {
      await buttons[index].click();
    } else {
      return res.json({ error: 'No button found at that index' });
    }

    await page.waitForTimeout(8000);

    if (videoURL) {
      return res.json({ videoURL });
    } else {
      return res.json({ error: 'No video URL found' });
    }
  } catch (err) {
    return res.json({ error: 'An error occurred', details: err.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
