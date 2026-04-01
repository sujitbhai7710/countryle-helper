const { chromium } = require('playwright');
const crypto = require('crypto');

// AES decryption key from the original code
const ENCRYPTION_KEY = '4%w!KpB+?FC<P9W*';

function decryptCountryId(encryptedId) {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const iv = Buffer.alloc(16, 0);
    
    const encrypted = Buffer.from(encryptedId, 'base64');
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
}

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all network requests
  const requests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('api') || url.includes('countryle') || url.includes('php')) {
      requests.push({
        url: url,
        method: request.method(),
        resourceType: request.resourceType()
      });
    }
  });

  // Capture responses
  const responses = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api') || url.includes('countryle') || url.includes('php')) {
      try {
        const body = await response.text();
        responses.push({
          url: url,
          status: response.status(),
          body: body.substring(0, 2000)
        });
      } catch (e) {
        // Ignore
      }
    }
  });

  console.log('Navigating to countryle.com...');
  await page.goto('https://countryle.com/', { waitUntil: 'networkidle', timeout: 60000 });
  
  console.log('Page loaded. Taking screenshot...');
  await page.screenshot({ path: '/home/z/my-project/screenshots/countryle-home.png', fullPage: true });

  // Get page title
  const title = await page.title();
  console.log('Page title:', title);

  // Look for mode buttons/switches
  console.log('\n--- Looking for game mode elements ---');
  const pageContent = await page.content();
  
  // Check if there's a "Capitale" or mode selector
  const capitaleMatch = pageContent.match(/capitale|capital/i);
  console.log('Capitale mention found:', capitaleMatch ? 'YES' : 'NO');

  // Get all interactive elements
  const elements = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('button, [role="button"], .mode, .switch, [class*="mode"], [class*="capital"]').forEach(el => {
      items.push({
        tag: el.tagName,
        text: el.textContent?.substring(0, 50),
        className: el.className,
        id: el.id
      });
    });
    return items;
  });
  
  console.log('\n--- Interactive elements ---');
  console.log(JSON.stringify(elements, null, 2));

  // Print captured requests
  console.log('\n--- Network Requests ---');
  requests.forEach(r => console.log(`${r.method} ${r.url}`));

  // Print captured responses
  console.log('\n--- Network Responses ---');
  responses.forEach(r => {
    console.log(`\n${r.status} ${r.url}`);
    console.log('Body:', r.body);
  });

  // Try to find and click on Capitale mode if exists
  try {
    const capitaleButton = await page.locator('text=/capitale/i').first();
    if (await capitaleButton.isVisible({ timeout: 5000 })) {
      console.log('\n--- Found Capitale button, clicking... ---');
      await capitaleButton.click();
      await page.waitForTimeout(3000);
      
      // Capture new requests after clicking
      console.log('New requests after clicking Capitale:');
      requests.forEach(r => console.log(`${r.method} ${r.url}`));
      
      await page.screenshot({ path: '/home/z/my-project/screenshots/countryle-capitale.png', fullPage: true });
    }
  } catch (e) {
    console.log('No Capitale button found or not visible');
  }

  // Check localStorage for any stored data
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      items[key] = window.localStorage.getItem(key);
    }
    return items;
  });
  
  console.log('\n--- LocalStorage ---');
  console.log(JSON.stringify(localStorage, null, 2));

  await browser.close();
}

main().catch(console.error);
