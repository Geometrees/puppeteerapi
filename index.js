const puppeteer = require('puppeteer-core');
const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();

// Function to find Chromium executable with extensive debugging
const findChromiumExecutable = () => {
  console.log('=== RUNTIME CHROMIUM DETECTION ===');
  
  // Common paths to check
  const possiblePaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/lib/chromium/chromium',
    '/usr/lib/chromium-browser/chromium-browser'
  ];
  
  console.log('Checking common paths:');
  for (const path of possiblePaths) {
    const exists = fs.existsSync(path);
    console.log(`  ${path}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    if (exists) {
      try {
        const stats = fs.statSync(path);
        console.log(`    - Executable: ${!!(stats.mode & 0o111)}`);
        console.log(`    - Size: ${stats.size} bytes`);
      } catch (err) {
        console.log(`    - Error checking stats: ${err.message}`);
      }
    }
  }
  
  // Try to find using 'which' command
  console.log('\nTrying to find with "which" command:');
  const commands = ['chromium-browser', 'chromium', 'google-chrome'];
  for (const cmd of commands) {
    try {
      const result = execSync(`which ${cmd}`, { encoding: 'utf8' }).trim();
      console.log(`  which ${cmd}: ${result}`);
      if (result && fs.existsSync(result)) {
        console.log(`Found executable at: ${result}`);
        return result;
      }
    } catch (err) {
      console.log(`  which ${cmd}: not found`);
    }
  }
  
  // Try to find using 'find' command
  console.log('\nSearching filesystem for chromium executables:');
  try {
    const findResult = execSync('find /usr -name "*chromium*" -type f -executable 2>/dev/null | head -10', { encoding: 'utf8' });
    console.log('Find results:');
    console.log(findResult);
    
    const paths = findResult.trim().split('\n').filter(p => p);
    for (const path of paths) {
      if (path.includes('chromium') && !path.includes('chromedriver')) {
        console.log(`Trying found path: ${path}`);
        return path;
      }
    }
  } catch (err) {
    console.log('Find command failed:', err.message);
  }
  
  // Check what's actually in /usr/bin
  console.log('\nContents of /usr/bin (chromium related):');
  try {
    const lsResult = execSync('ls -la /usr/bin/ | grep -i chrom', { encoding: 'utf8' });
    console.log(lsResult);
  } catch (err) {
    console.log('No chromium-related files in /usr/bin');
  }
  
  console.log('=== END RUNTIME DETECTION ===\n');
  
  // Return first existing path or throw error
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  
  throw new Error('Chromium executable not found anywhere on the system');
};

// Test endpoint to check Chromium availability
app.get('/debug-chromium', (req, res) => {
  try {
    const executablePath = findChromiumExecutable();
    res.json({ 
      success: true, 
      executablePath,
      message: 'Chromium found successfully'
    });
  } catch (err) {
    res.json({ 
      success: false, 
      error: err.message 
    });
  }
});

app.get('/get-stream-url', async (req, res) => {
  let browser = null;
  
  try {
    const executablePath = findChromiumExecutable();
    console.log(`Using Chromium at: ${executablePath}`);
    
    // Test if the executable actually works
    console.log('Testing Chromium executable...');
    try {
      const versionOutput = execSync(`${executablePath} --version`, { encoding: 'utf8', timeout: 5000 });
      console.log(`Chromium version: ${versionOutput.trim()}`);
    } catch (versionErr) {
      console.log('Warning: Could not get Chromium version:', versionErr.message);
    }
    
    browser = await puppeteer.launch({
      executablePath,
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
        '--disable-renderer-backgrounding'
      ]
    });

    console.log('Browser launched successfully');
    const page = await browser.newPage();
    let videoURL = null;

    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    page.on('request', request => {
      const url = request.url();
      if (url.endsWith('.m3u8') || url.endsWith('.mp4') || url.endsWith('.mpd')) {
        videoURL = url;
        console.log('Found video URL:', url);
      }
    });

    console.log('Navigating to page...');
    await page.goto('https://ww5.123moviesfree.net/season/american-housewife-season-1-17065/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Waiting for video options...');
    await page.waitForSelector('.video-option', { timeout: 10000 });
    const buttons = await page.$$('.video-option');
    console.log(`Found ${buttons.length} video options`);

    const VIDEO_INDEX = parseInt(req.query.index) || 0;
    if (buttons[VIDEO_INDEX]) {
      console.log(`Clicking button at index ${VIDEO_INDEX}`);
      await buttons[VIDEO_INDEX].click();
    } else {
      throw new Error(`No button found at index ${VIDEO_INDEX}`);
    }

    console.log('Waiting for video to load...');
    await page.waitForTimeout(8000);

    if (videoURL) {
      console.log('Video URL found:', videoURL);
      return res.json({ videoURL });
    } else {
      console.log('No video URL captured');
      return res.json({ error: 'No video URL found' });
    }

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'An error occurred', details: err.message });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error('Error closing browser:', closeErr);
      }
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Available debug endpoints:');
  console.log(`  GET /debug-chromium - Check Chromium installation`);
  console.log(`  GET /health - Health check`);
  console.log(`  GET /get-stream-url?index=0 - Get stream URL`);
  
  // Run initial Chromium detection
  try {
    findChromiumExecutable();
  } catch (err) {
    console.error('Initial Chromium detection failed:', err.message);
  }
});