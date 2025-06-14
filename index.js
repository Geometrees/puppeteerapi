const puppeteer = require('puppeteer-core');
const express = require('express');
const app = express();

// Simple Chromium path - we know it's here because Docker build verified it
const CHROMIUM_PATH = '/usr/bin/chromium-browser';

app.get('/get-stream-url', async (req, res) => {
  let browser = null;
  
  try {
    console.log(`Launching Chromium from: ${CHROMIUM_PATH}`);
    
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-translate',
        '--disable-background-networking'
      ]
    });

    console.log('✅ Browser launched successfully');
    
    const page = await browser.newPage();
    let videoURL = null;

    // Set reasonable timeouts
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    // Listen for video URLs
    page.on('request', request => {
      const url = request.url();
      if (url.endsWith('.m3u8') || url.endsWith('.mp4') || url.endsWith('.mpd')) {
        videoURL = url;
        console.log('🎥 Found video URL:', url);
      }
    });

    console.log('🌐 Navigating to page...');
    await page.goto('https://ww5.123moviesfree.net/season/american-housewife-season-1-17065/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('🔍 Looking for video options...');
    await page.waitForSelector('.video-option', { timeout: 15000 });
    const buttons = await page.$$('.video-option');
    console.log(`📱 Found ${buttons.length} video options`);

    const VIDEO_INDEX = parseInt(req.query.index) || 0;
    if (buttons[VIDEO_INDEX]) {
      console.log(`👆 Clicking button at index ${VIDEO_INDEX}`);
      await buttons[VIDEO_INDEX].click();
      
      console.log('⏳ Waiting for video to load...');
      await page.waitForTimeout(8000);
      
      if (videoURL) {
        console.log('✅ Success! Video URL found:', videoURL);
        return res.json({ videoURL });
      } else {
        console.log('❌ No video URL captured after clicking');
        return res.json({ error: 'No video URL found after clicking button' });
      }
    } else {
      throw new Error(`No button found at index ${VIDEO_INDEX}. Available buttons: ${buttons.length}`);
    }

  } catch (err) {
    console.error('💥 Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
      error: 'An error occurred', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('🔒 Browser closed');
      } catch (closeErr) {
        console.error('Error closing browser:', closeErr.message);
      }
    }
  }
});

// Health check that also verifies Chromium
app.get('/health', async (req, res) => {
  try {
    // Quick Chromium test
    const browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    await browser.close();
    
    res.json({ 
      status: 'OK', 
      chromium: 'Working',
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR', 
      chromium: 'Failed',
      error: err.message,
      timestamp: new Date().toISOString() 
    });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log('📋 Available endpoints:');
  console.log(`   GET /health - Health check + Chromium test`);
  console.log(`   GET /get-stream-url?index=0 - Get stream URL`);
});