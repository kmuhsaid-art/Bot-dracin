const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const cors = require('cors');       
const mongoose = require('mongoose'); 
const axios = require('axios');

const app = express();
app.use(cors()); 
app.use(express.json()); 

mongoose.connect('mongodb+srv://Hahihu:Blink182@cluster0.i1btqnj.mongodb.net/dracinDB?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

const Film = mongoose.model('Film', {
  judul: String,
  deskripsi: String,
  link: String,
  thumb: String
});

const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

const GLOBAL_PARAMS = {
    "iid": "7224810948585719302",
    "device_id": "7224810948585719302",
    "aid": "645713",
    "app_name": "Melolo",
    "device_platform": "android",
    "language": "in"
};

const meloloHeaders = {
    'User-Agent': 'com.melolo.video/1.3.2 (Linux; U; Android 11; en_US; POCO F3 Build/RKQ1.200826.002)',
    'Host': 'api-va.tmtreader.com',
    'Connection': 'keep-alive'
};

function getRticket() { return Date.now().toString(); }

async function searchMelolo(query, limit = "10") {
    try {
        const res = await axios.get("https://api-va.tmtreader.com/i18n_novel/search/page/v1/", {
            params: { ...GLOBAL_PARAMS, query, limit },
            headers: meloloHeaders
        });
        const books = [];
        const searchData = res.data?.data?.search_data;
        if (Array.isArray(searchData)) {
            searchData.forEach(item => {
                if (item.books && Array.isArray(item.books)) {
                    item.books.forEach(b => {
                        books.push({ series_id: b.book_id, title: b.book_name, thumb_url: b.thumb_url });
                    });
                }
            });
        }
        return books;
    } catch (e) { return []; }
}

async function getVideoDetails(book_id) {
    try {
        const res = await axios.get("https://api-va.tmtreader.com/i18n_novel/book/video_list/v1/", {
            params: { ...GLOBAL_PARAMS, book_id, "count": "1" },
            headers: meloloHeaders
        });
        return res.data?.data?.video_list?.[0]?.video_id || null;
    } catch (e) { return null; }
}

async function getVideoModel(video_id) {
    try {
        const data = { biz_param: { video_id_type: 0, source: 4, video_platform: 3 }, video_id };
        const res = await axios.post("https://api.tmtreader.com/novel/player/video_model/v1/", data, { 
            headers: { ...meloloHeaders, "Content-Type": "application/json" },
            params: { ...GLOBAL_PARAMS, _rticket: getRticket() }
        });
        return res.data?.data?.main_url || res.data?.data?.backup_url || null;
    } catch (e) { return null; }
}

app.get('/api/drama', async (req, res) => {
  try {
    const dramas = await Film.find().sort({ _id: -1 });
    res.json(dramas);
  } catch (err) { res.status(500).send(err); }
});

bot.start((ctx) => {
  ctx.replyWithMarkdown(`👋 *Selamat Datang*\n\nGunakan /sync <tajuk> untuk cari drama.`,
    Markup.inlineKeyboard([[Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')]])
  );
});

bot.command('sync', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!query) return ctx.reply("❌ Contoh: /sync cinta");
    ctx.reply(`⏳ Mencari "${query}"...`);
    try {
        const books = await searchMelolo(query);
        if (books.length === 0) return ctx.reply("❌ Tiada drama dijumpai.");
        let count = 0;
        for (let book of books) {
            const wujud = await Film.findOne({ judul: book.title });
            if (!wujud) {
                const videoId = await getVideoDetails(book.series_id);
                if (videoId) {
                    const videoUrl = await getVideoModel(videoId);
                    if (videoUrl) {
                        await new Film({ judul: book.title, deskripsi: "Melolo Original", link: videoUrl, thumb: book.thumb_url }).save();
                        count++;
                    }
                }
            }
        }
        ctx.reply(count > 0 ? `✅ Berjaya ditambah ${count} drama!` : `ℹ️ Drama sudah ada.`);
    } catch (err) { ctx.reply(`❌ Ralat: ${err.message}`); }
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log(`🚀 Live`));
bot.launch();

