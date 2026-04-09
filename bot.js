const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const cors = require('cors');       
const mongoose = require('mongoose'); 
const axios = require('axios');

const app = express();
app.use(cors()); 
app.use(express.json()); 

// --- 1. SAMBUNGAN MONGODB ---
mongoose.connect('mongodb+srv://Hahihu:Blink182@cluster0.i1btqnj.mongodb.net/dracinDB?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// --- 2. DEFINISI MODEL ---
const Film = mongoose.model('Film', {
  judul: String,
  deskripsi: String,
  link: String,
  thumb: String
});

const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// --- 3. KONFIGURASI API MELOLO ---
function getRticket() { return Date.now().toString(); }

const meloloHeaders = {
    'User-Agent': 'com.melolo.video/1.3.2 (Linux; U; Android 11; en_US; POCO F3 Build/RKQ1.200826.002)',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Host': 'api-va.tmtreader.com',
    'x-tt-token': '', // Biarkan kosong jika tiada dalam sniffing
    'sdk-version': '2'
};

const meloloParams = {
    "iid": "7549249992780367617", "device_id": "6944790948585719298", "aid": "645713", 
    "app_name": "Melolo", "device_platform": "android", "language": "in"
};

async function searchMelolo(query, limit = "20") {
    try {
        const res = await axios.get("https://api-va.tmtreader.com/i18n_novel/search/page/v1/", {
            params: {
                "query": query,
                "limit": limit,
                "iid": "7224810948585719302", // Pastikan ID ini segar
                "device_id": "7224810948585719302",
                "aid": "645713",
                "app_name": "Melolo",
                "device_platform": "android",
                "language": "in"
            },
            headers: {
                'User-Agent': 'com.melolo.video/1.3.2 (Linux; U; Android 11; en_US; POCO F3 Build/RKQ1.200826.002)',
                'Host': 'api-va.tmtreader.com'
            }
        });

        // Debug: Lihat apa yang Melolo balas dalam log Render
        console.log("Respon Melolo:", JSON.stringify(res.data));

        const books = [];
        // Pastikan kita semak sama ada data itu wujud sebelum guna .forEach
        const searchData = res.data?.data?.search_data;

        if (searchData && Array.isArray(searchData)) {
            searchData.forEach(item => {
                if (item.books && Array.isArray(item.books)) {
                    item.books.forEach(b => {
                        books.push({
                            series_id: b.book_id,
                            title: b.book_name,
                            thumb_url: b.thumb_url
                        });
                    });
                }
            });
        } else {
            console.log("⚠️ Melolo memulangkan senarai kosong atau format salah.");
        }

        return books;
    } catch (e) {
        console.error("❌ Ralat API Melolo:", e.message);
        return [];
    }
}

async function getVideoDetails(series_id) {
    try {
        const data = { biz_param: { video_id_type: 1, source: 4 }, series_id };
        const res = await axios.post("https://api.tmtreader.com/novel/player/video_detail/v1/", data, { 
            headers: { ...meloloHeaders, "Content-Type": "application/json" },
            params: { ...meloloParams, _rticket: getRticket() }
        });
        return res.data?.data?.video_data?.video_list?.[0]?.vid || null;
    } catch (e) { return null; }
}

async function getVideoModel(video_id) {
    try {
        const data = { biz_param: { video_id_type: 0, source: 4, video_platform: 3 }, video_id };
        const res = await axios.post("https://api.tmtreader.com/novel/player/video_model/v1/", data, { 
            headers: { ...meloloHeaders, "Content-Type": "application/json" },
            params: { ...meloloParams, _rticket: getRticket() }
        });
        return res.data?.data?.main_url || res.data?.data?.backup_url || null;
    } catch (e) { return null; }
}

// --- 4. API UNTUK MINI APP ---
app.get('/api/drama', async (req, res) => {
  try {
    const dramas = await Film.find().sort({ _id: -1 });
    res.json(dramas);
  } catch (err) { res.status(500).send(err); }
});

// --- 5. LOGIK BOT TELEGRAM ---
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke @${ctx.botInfo.username}*\n\n` +
    `Katalog drama sedia untuk dilayan!\n\n` +
    `📌 *ARAHAN:*\n` +
    `• /sync <tajuk> - Cari & ambil drama dari Melolo`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [Markup.button.callback('💎 VIP', 'view_vip'), Markup.button.callback('👤 Profil', 'view_profile')]
    ])
  );
});

bot.command('sync', async (ctx) => {
    // Ambil semua teks selepas /sync secara bersih
    const args = ctx.message.text.split(' ');
    args.shift(); // Buang '/sync'
    const query = args.join(' ').trim();

    if (!query) return ctx.reply("❌ Sila masukkan tajuk. Contoh: /sync cinta");

    ctx.reply(`⏳ Mencari "${query}" di pangkalan data Melolo...`);
    
    try {
        const books = await searchMelolo(query, "10");
        
        if (!books || books.length === 0) {
            return ctx.reply(`❌ Tiada drama dijumpai untuk "${query}".\n\nTips: Cuba guna satu perkataan sahaja (Contoh: /sync gadis)`);
        }

        let count = 0;
        for (let book of books) {
            const wujud = await Film.findOne({ judul: book.title });
            if (!wujud) {
                const videoId = await getVideoDetails(book.series_id);
                if (videoId) {
                    const videoUrl = await getVideoModel(videoId);
                    if (videoUrl) {
                        await new Film({
                            judul: book.title,
                            deskripsi: "Drama Melolo Original",
                            link: videoUrl,
                            thumb: book.thumb_url
                        }).save();
                        count++;
                    }
                }
            }
        }
        
        if (count === 0) {
            ctx.reply(`ℹ️ Drama untuk "${query}" sudah ada dalam katalog atau tiada pautan video aktif.`);
        } else {
            ctx.reply(`✅ Berjaya! ${count} drama baharu telah ditambah ke katalog.`);
        }
    } catch (err) {
        ctx.reply(`❌ Ralat teknikal: ${err.message}`);
    }
});

bot.action('view_vip', (ctx) => ctx.reply("Hubungi Admin untuk VIP."));
bot.action('view_profile', (ctx) => ctx.reply(`ID: ${ctx.from.id}`));

app.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log(`🚀 API Berjalan`));
bot.launch();
