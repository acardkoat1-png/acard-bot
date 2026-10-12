const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

async function fetchTikTokVideos(query) {
  try {
    const response = await axios.get(`https://lyric-search-neon.vercel.app/kshitiz?keyword=${query}`);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = {
  config: {
    name: "aniedits",
    aliases: [],
    author: "Acard",
    version: "2.0",
    shortDescription: {
      ar: "جلب إيديتات أنمي",
    },
    longDescription: {
      ar: "البحث عن فيديوهات إيديت أنمي",
    },
    category: "media",
    guide: {
      ar: "{p}{n} [استعلام]",
    },
  },
  onStart: async function ({ api, event, args }) {
     api.setMessageReaction("✨", event.messageID, (err) => {}, true);
    const query = args.join(' ');
    const modifiedQuery = `${query} anime edit`;

    const videos = await fetchTikTokVideos(modifiedQuery);

    if (!videos || videos.length === 0) {
      api.sendMessage({ body: `${query} غير موجود.` }, event.threadID, event.messageID);
      return;
    }

    const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
    const videoUrl = selectedVideo.videoUrl;

    if (!videoUrl) {
      api.sendMessage({ body: 'خطأ: الفيديو غير موجود.' }, event.threadID, event.messageID);
      return;
    }

    try {
      const videoStream = await getStreamFromURL(videoUrl);

      await api.sendMessage({
        body: ``,
        attachment: videoStream,
      }, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: 'حدث خطأ أثناء معالجة الفيديو.\nيرجى المحاولة لاحقاً.' }, event.threadID, event.messageID);
    }
  },
};