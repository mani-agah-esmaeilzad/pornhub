const {
    PornHub
} = require('pornhub.js');
const pornhub = new PornHub();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const {
    writeFile
} = require('fs').promises;
const TelegramBot = require('node-telegram-bot-api');

const token = '7162857504:AAE8O8-vnSnV0BCAVOkaDbrzzA17xoYHo1A';
const bot = new TelegramBot(token, {
    polling: true
});

let now = 1;
const MAX_SIZE_MB = 10;

const getMovie = async () => {
    try {
        let videoUrl = null;
        let videoSize = 0;

        while (!videoUrl || videoSize > MAX_SIZE_MB * 1024 * 1024) {
            const result = await pornhub.randomVideo();
            console.log('Random video URL:', result.url);
            const video = await pornhub.video(result.url);
            console.log('Video details:', video);

            const mp4Videos = video.mediaDefinitions.filter(e => e.format === 'mp4');
            if (mp4Videos.length > 0) {
                videoUrl = mp4Videos[0].videoUrl.replace(/\\/g, '');
                console.log('MP4 video URL:', videoUrl);

                videoSize = await getFileSize(videoUrl);
                console.log('Video size (bytes):', videoSize);
            }
        }

        await getData(videoUrl);

    } catch (error) {
        console.error('Error in getMovie:', error);
    }
};

const getFileSize = async (url) => {
    try {
        const res = await fetch(url, {
            method: 'HEAD'
        });
        const size = res.headers.get('content-length');
        return size ? parseInt(size, 10) : 0;
    } catch (error) {
        console.error('Error in getFileSize:', error);
        return 0;
    }
};

const getData = async (url) => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Fetched video data:', data);
        await downloadFile(data[0].videoUrl, path.resolve(__dirname, `${now}.mp4`));
        now++;
    } catch (error) {
        console.error('Error in getData:', error);
    }
};

const downloadFile = async (url, filePath) => {
    try {
        const res = await fetch(url);
        const fileStream = fs.createWriteStream(filePath);
        await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on('error', reject);
            fileStream.on('finish', resolve);
        });
        console.log('File downloaded:', filePath);
    } catch (error) {
        console.error('Error in downloadFile:', error);
    }
};

bot.on('message', async msg => {
    const chatId = msg.chat.id;
    if (msg.text === '/start') {
        console.log('Received /start command');
        await getMovie();
        bot.sendMessage(chatId, 'سلام');
    } else if (msg.text === '/give') {
        console.log('Received /give command');
        await getMovie();
        await bot.sendVideo(chatId, `${now - 1}.mp4`);
        console.log('Video sent to chat:', chatId);
    }
});