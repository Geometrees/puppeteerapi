const puppeteer = require('puppeteer'); // NOT puppeteer-core
const express = require('express');
const app = express();

app.get('/get-stream-url', async (req, res) => {
  let browser = null;
  
  try {
    console.log('🚀 Launching browser...');
    
    // Let Puppeteer use its own Chromium - no executablePath needed
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ]
    });

    console.log('✅ Browser launched');
    
    const page = await browser.newPage();
    let videoURL = null;

    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    page.on('request', request => {
      const url = request.url();
      if (url.endsWith('.m3u8') || url.endsWith('.mp4') || url.endsWith('.mpd')) {
        videoURL = url;
        console.log('🎥 Found video URL:', url);
      }
    });

    console.log('🌐 Going to page...');
    await page.goto('https://ww5.123moviesfree.net/season/american-housewife-season-1-17065/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('🔍 Looking for buttons...');
    await page.waitForSelector('.video-option', { timeout: 15000 });
    const buttons = await page.$$('.video-option');
    console.log(`Found ${buttons.length} buttons`);

    const VIDEO_INDEX = parseInt(req.query.index) || 0;
    if (buttons[VIDEO_INDEX]) {
      console.log(`Clicking button ${VIDEO_INDEX}`);
      await buttons[VIDEO_INDEX].click();
      await page.waitForTimeout(8000);
      
      if (videoURL) {
        return res.json({ videoURL });
      } else {
        return res.json({ error: 'No video URL found' });
      }
    } else {
      return res.json({ error: `No button at index ${VIDEO_INDEX}` });
    }

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      error: 'An error occurred', 
      details: err.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});