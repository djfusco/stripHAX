const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');

const URL = 'https://haxapi.vercel.app/api/apps/haxcms/siteToHtml?site=https://oer.hax.psu.edu/axm63/sites/astro130&type=link&magic=https://cdn.webcomponents.psu.edu/cdn/';

const videosDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videosDir)){
  fs.mkdirSync(videosDir);
}

const referencesDir = path.join(__dirname, 'references');
if (!fs.existsSync(referencesDir)){
  fs.mkdirSync(referencesDir);
}

const filePath = './references/allVideosInfo.json';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

async function getVideos() {
    const videoLinks = [];
    try {
        const response = await axios.get(URL);
        const html = response.data;
        const $ = cheerio.load(html);
        $('video-player').each((i, link) => {
            const source = $(link).attr('source');
            if (source.includes('youtube.com/watch') || source.includes('youtu.be/')) {
                videoLinks.push(source);
            }
        });
    } catch (error) {
        console.error(error);
    }
    return videoLinks;
}

async function downloadVideo(link, index) {
    try {
      const stream = ytdl(link);
      const videoPath = path.join(videosDir, `video${index}.mp4`);
      const videoStream = stream.pipe(fs.createWriteStream(videoPath));
  
      return new Promise((resolve, reject) => {
        videoStream.on('finish', resolve);
        videoStream.on('error', reject);
      });
    } catch (error) {
      console.error(error);
    }
}
  
async function downloadAllVideos(videoLinks) {
    for (let index = 0; index < videoLinks.length; index++) {
      await downloadVideo(videoLinks[index], index).then(() => console.log(`Video ${index} downloaded successfully.`));
    }
}

async function processVideos() {
    const videoGoodLinks = [];
    const videoBadLinks = [];
    const videoLinksInfo = [];
    try {
        const data = await getVideos(); 
    
        for (const source of data) {
          try {
            const info = await ytdl.getInfo(source); 
            const title = info.videoDetails.title;
            videoGoodLinks.push(source);
            videoLinksInfo.push({ source, title });
            console.log('Video info retrieved:', info.videoDetails.title);
          } catch (error) {
            videoBadLinks.push(source);
            console.error('Error fetching video information for:', source, error);
          }
        }
        console.log('All videos processed.');

        try {
            await downloadAllVideos(videoGoodLinks);
            const dataToWrite = JSON.stringify(videoLinksInfo, null, 2);
            fs.writeFileSync(filePath, dataToWrite);
            console.log('File written successfully');
            console.log('All videos downloaded.');
        } catch (downloadError) {
            console.error('Error downloading videos:', downloadError);
        }

      } catch (error) {
        console.error('Error processing video links:', error);
      }
}

processVideos();
