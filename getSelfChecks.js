const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://haxapi.vercel.app/api/apps/haxcms/siteToHtml?site=https://oer.hax.psu.edu/axm63/sites/astro130&type=link&magic=https://cdn.webcomponents.psu.edu/cdn/';


const selfChecksDir = path.join(__dirname, 'references');
if (!fs.existsSync(selfChecksDir)){
  fs.mkdirSync(selfChecksDir);
}

const filePath = './references/selfChecks.json';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

async function extractAllSelfCheckData(url) {
    try {
      const response = await axios.get(url);
      const htmlContent = response.data;
  
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
  
      const selfCheckElements = document.querySelectorAll('self-check');
      const selfChecks = [];
  
      selfCheckElements.forEach((selfCheckElement) => {
        const questionSpan = selfCheckElement.querySelector('span[slot="question"]');
        const question = questionSpan ? questionSpan.textContent : '';
  
        const answerSpan = selfCheckElement.querySelector('span:not([slot])');
        const answer = answerSpan ? answerSpan.innerHTML : '';
  
        selfChecks.push({ question, answer });
      });
  
      console.log(selfChecks);
      
      const dataToWrite = JSON.stringify(selfChecks, null, 2);
      try {
        fs.writeFileSync(filePath, dataToWrite);
        console.log('File written successfully');
      } catch (error) {
        console.error('Error writing file:', error);
      }

      return selfChecks;
      } catch (error) {
        console.error('Error fetching or parsing the HTML content:', error);
      }
  }

extractAllSelfCheckData(URL);