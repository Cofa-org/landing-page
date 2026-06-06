const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1280, height: 1200 });

  console.log('Navigating to http://localhost:5174/registro-simulador...');
  try {
    await page.goto('http://localhost:5174/registro-simulador', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for the welcome step illustration or container to render
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Wait a brief moment for layout/animations/images to render
    await page.waitForTimeout(2000);

    const screenshotPath = 'C:\\Users\\BEELINK\\.gemini\\antigravity-ide\\brain\\242d2b7a-ef74-44e3-aec7-de037e00f639\\welcome_screen_step.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('📸 Screenshot saved to ' + screenshotPath);
  } catch (error) {
    console.error('Error during execution:', error.message);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
