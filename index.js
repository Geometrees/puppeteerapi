app.get('/get-stream-url', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto('https://ww5.123moviesfree.net/season/american-housewife-season-1-17065/', {
      waitUntil: 'networkidle2'
    });

    // Try waiting for network response
    const found = await page.waitForResponse(
      response => response.url().match(/\.(m3u8|mp4|mpd)/),
      { timeout: 15000 }
    ).catch(() => null);

    if (found) {
      const url = found.url();
      console.log('Matched stream response:', url);
      res.json({ streamUrl: url });
    } else {
      // Try scraping video tag
      const videoSrc = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          return video.src || (video.querySelector('source') ? video.querySelector('source').src : null);
        }
        return null;
      });

      if (videoSrc) {
        console.log('Matched video tag src:', videoSrc);
        res.json({ streamUrl: videoSrc });
      } else {
        res.status(404).json({ error: 'Stream URL not found' });
      }
    }

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.toString() });
  } finally {
    if (browser) await browser.close();
  }
});
