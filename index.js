const puppeteer = require('puppeteer-core');
const express = require('express');
const app = express();

app.get('/get-stream-url', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser', // or '/usr/bin/chromium' or wherever Chromium is on Render
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

    const VIDEO_INDEX = req.query.index || 0;
    if (buttons[VIDEO_INDEX]) {
      await buttons[VIDEO_INDEX].click();
    } else {
      await browser.close();
      return res.json({ error: 'No button found at that index' });
    }

    await page.waitForTimeout(8000);
    await browser.close();

    if (videoURL) {
      return res.json({ videoURL });
    } else {
      return res.json({ error: 'No video URL found' });
    }

  } catch (err) {
    console.error(err);
    res.json({ error: 'An error occurred', details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
