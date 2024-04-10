const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://haxapi.vercel.app/api/apps/haxcms/siteToHtml?site=https://oer.hax.psu.edu/axm63/sites/astro130&type=link&magic=https://cdn.webcomponents.psu.edu/cdn/';

/*
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)){
  fs.mkdirSync(imagesDir);
}
*/

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

async function extractAllSelfCheckData(url) {
    try {
      // Fetch the HTML content from the URL
      const response = await axios.get(url);
      const htmlContent = response.data;
  
      // Parse the HTML content with jsdom
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
  
      // Find all <self-check> elements
      const selfCheckElements = document.querySelectorAll('self-check');
      const selfChecks = [];
  
      // Iterate over each <self-check> element
      selfCheckElements.forEach((selfCheckElement) => {
        // Extract the question
        const questionSpan = selfCheckElement.querySelector('span[slot="question"]');
        const question = questionSpan ? questionSpan.textContent : '';
  
        // Extract the answer, which is assumed to be in the next <span>
        const answerSpan = selfCheckElement.querySelector('span:not([slot])');
        const answer = answerSpan ? answerSpan.innerHTML : ''; // using innerHTML to preserve <sup>
  
        // Add to the array
        selfChecks.push({ question, answer });
      });
  
      // Log the results or do something with the data
      console.log(selfChecks);
      return selfChecks;
    } catch (error) {
      console.error('Error fetching or parsing the HTML content:', error);
    }
  }

extractAllSelfCheckData(URL);