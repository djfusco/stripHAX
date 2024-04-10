const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://haxapi.vercel.app/api/apps/haxcms/siteToHtml?site=https://oer.hax.psu.edu/axm63/sites/astro130&type=link&magic=https://cdn.webcomponents.psu.edu/cdn/';

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)){
  fs.mkdirSync(imagesDir);
}

const referencesDir = path.join(__dirname, 'references');
if (!fs.existsSync(referencesDir)){
  fs.mkdirSync(referencesDir);
}

const filePath = './references/allImagesInfo.json';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

async function fetchAndProcessImages(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const imageLinks = [];
    const imageLinksInfo = [];

    $('media-image').each((i, link) => {
      const source = $(link).attr('source');
      const modalTitle = $(link).attr('modal-title');
      imageLinks.push(source);
      imageLinksInfo.push({ source, modalTitle });
    });

    console.log(imageLinks);

    const fetchPromises = imageLinks.map(async (link, index) => {
      try {
        const response = await axios({
          method: 'get',
          url: link,
          responseType: 'stream',
        });
        const imagePath = path.join(imagesDir, `image${index}.jpg`);
        response.data.pipe(fs.createWriteStream(imagePath));
      } catch (error) {
        console.error(error);
      }
    });

    await Promise.all(fetchPromises);

    const dataToWrite = JSON.stringify(imageLinksInfo, null, 2);
    fs.writeFileSync(filePath, dataToWrite);
    console.log('File written successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchAndProcessImages(URL);
