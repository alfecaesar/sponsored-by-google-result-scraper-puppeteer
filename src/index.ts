import puppeteer from 'puppeteer';

(async () => {
  // Launch a new browser instance
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to Google and perform a search
  const searchQuery = 'buy linjer';
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);

  // Wait for the search results to load
  await page.waitForSelector('div#search');

  // Extract product data from the sponsored list
  const products = await page.evaluate(() => {
    // Array to hold product information
    const productList: { title: string, url: string, price: string, ratingStar: string, ratingNum: string }[] = [];

    // Select sponsored product elements
    const sponsoredItems = document.querySelectorAll('.pla-unit');

    sponsoredItems.forEach(item => {
      // Extract the title
      const titleElement = item.querySelector('.pymv4e');
      const title = titleElement ? titleElement.textContent || '' : '';

      // Extract the URL
      const urlElement = item.querySelector('a.pla-unit-title-link') as HTMLAnchorElement;
      const url = urlElement ? urlElement.href : '';

      // Extract the price
      let price = '';
      const priceElement = item.querySelector('.e10twf');
      if (priceElement) {
        price = priceElement.textContent || '';
      }

      // Extract the rating star
      let ratingStar = '';
      const ratingStarElement = item.querySelector('.z3HNkc');
      if (ratingStarElement) {
        ratingStar = ratingStarElement.getAttribute('aria-label')?.replace(',','') || '';
      }

      // Extract the rating num
      let ratingNum = '';
      const ratingNumElement = item.querySelector('.pbAs0b');
      if (ratingNumElement) {
        ratingNum = ratingNumElement.getAttribute('aria-label') || '';
      }

      // Add product to the list
      if (title && url) {
        productList.push({ title, url, price, ratingStar, ratingNum });
      }
    });

    return productList;
  });

  // Log the extracted product data
  console.log('Sponsored Products:', products);

  // Get the bounding box of the .pla-exp-container element
  const carouselBoundingBox = await page.evaluate(() => {
    const carouselElement = document.querySelector('.pla-exp-container');
    if (!carouselElement) return null;
    const { top, left, width, height } = carouselElement.getBoundingClientRect();
    return { top, left, width, height };
  });

  if (!carouselBoundingBox) {
    console.error('Unable to find .pla-exp-container element.');
    await browser.close();
    return;
  }

  // Take a screenshot of the portion containing the carousel
  await page.screenshot({
    path: 'screenshots/sponsored_list.png',
    clip: {
      x: carouselBoundingBox.left,
      y: carouselBoundingBox.top,
      width: carouselBoundingBox.width,
      height: carouselBoundingBox.height
    }
  });

  // Close the browser
  await browser.close();
})();
