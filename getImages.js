const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://haxapi.vercel.app/api/apps/haxcms/siteToHtml?site=https://oer.hax.psu.edu/axm63/sites/astro130&type=link&magic=https://cdn.webcomponents.psu.edu/cdn/';

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)){
  fs.mkdirSync(imagesDir);
}

axios.get(URL)
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);
    const imageLinks = [];

    $('media-image').each((i, link) => {
      const source = $(link).attr('source');
      imageLinks.push(source);
    });

    console.log(imageLinks);

    imageLinks.forEach((link, index) => {
      axios({
        method: 'get',
        url: link,
        responseType: 'stream'
      })
      .then(response => {
        const imagePath = path.join(imagesDir, `image${index}.jpg`);
        response.data.pipe(fs.createWriteStream(imagePath));

      })
      .catch(console.error);
    });
    
  })
  .catch(console.error);
