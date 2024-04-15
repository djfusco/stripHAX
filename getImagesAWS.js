require('dotenv').config();

const axios = require('axios');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
const stream = require('stream');

const URL = 'https://haxapi.vercel.app/api/apps/haxcms/siteToHtml?site=https://oer.hax.psu.edu/axm63/sites/astro130&type=link&magic=https://cdn.webcomponents.psu.edu/cdn/';


AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
bucketAWS = process.env.AWS_BUCKET;

const s3 = new AWS.S3();

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

async function uploadToS3(bucketName, key, body) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: body,
    ACL: 'public-read' // Optional: Adjust based on your requirement
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function fetchAndProcessImages(url, bucketName) {
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

    // Upload images
    const uploadPromises = imageLinks.map((link, index) => {
      return axios({
        method: 'get',
        url: link,
        responseType: 'stream'
      }).then(response => {
        //const key = `image${index}.jpg`;
        const key = `images/image${index}.jpg`;
        return uploadToS3(bucketName, key, response.data);
      }).catch(error => {
        console.error('Error fetching image:', error);
      });
    });

    // Wait for all uploads to finish
    await Promise.all(uploadPromises);

    // Upload metadata as JSON
    //const metadataKey = 'imageLinksInfo.json';
    const folderName = 'references'; // Specify the folder name where you want to store your JSON file
    const metadataKey = `${folderName}/imageLinksInfo.json`; // Prepend the folder name to the file name
    const dataToWrite = JSON.stringify(imageLinksInfo, null, 2);
    await uploadToS3(bucketName, metadataKey, Buffer.from(dataToWrite), 'application/json');

    console.log('All images and metadata uploaded successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchAndProcessImages(URL, bucketAWS);
