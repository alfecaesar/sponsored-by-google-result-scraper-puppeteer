import express from "express";
import puppeteer from 'puppeteer';

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const browserWSEndpoint = "https://production-sfo.browserless.io?token=00018e67-0284-4f26-a617-35b4ac894415";
const app = express();

const getBrowser = async () =>
  IS_PRODUCTION ? puppeteer.connect({ browserWSEndpoint }) : puppeteer.launch();

(async () => {
  let browser: { close: () => any; } | null = null; 

  await getBrowser()
    .then(async (browser) => {
      const page = await browser.newPage();
      
      // Navigate to Google and perform a search
      const searchQuery = 'buy linjer';
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);

      // Wait for the search results to load
      await page.waitForSelector('div#search');

      // Extract product data from the sponsored list
      const products = await page.evaluate(() => {
        // Array to hold product information
        const productList: { title: string, url: string, image: string, price: string, ratingStar: string, ratingNum: string }[] = [];

        // Select sponsored product elements
        const sponsoredItems = document.querySelectorAll('.pla-unit');

        sponsoredItems.forEach(item => {
            // Extract the title
            const title = item.querySelector('a.pla-unit-title-link')?.textContent || '';

            // Extract the URL
            //const url = (item.querySelector('a.pla-unit-title-link') as HTMLAnchorElement).href || '';
            const url = (item.querySelector('a.pla-unit-title-link') as HTMLAnchorElement)?.href || '';

            // Extract the Image
            const image = (item.querySelector('.pla-unit-img-container img') as HTMLImageElement)?.src;

            // Extract the price
            const price = (item.querySelector('.e10twf')?.textContent || '').replace("$", "");

            // Extract the rating star
            const ratingStar = (item.querySelector('.z3HNkc')?.ariaLabel || '').split(" ")[1];

            // Extract the rating num
            const ratingNum = (item.querySelector('.pbAs0b')?.ariaLabel || '').replace(/[^0-9]/g, '');

            // Add product to the list
            if (title && url) {
                productList.push({ title, url, image, price, ratingStar, ratingNum });
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
      /*
      await page.screenshot({
        path: 'screenshots/sponsored_list.png',
        clip: {
          x: carouselBoundingBox.left,
          y: carouselBoundingBox.top,
          width: carouselBoundingBox.width,
          height: carouselBoundingBox.height
        }
      });
      */

    })
    .catch((error) => {
      console.error(error);
    })
    .finally();



  
})();
