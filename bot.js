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
    "Host": "api.tmtreader.com",
    "Accept": "application/json; charset=utf-8,application/x-protobuf",
    "X-Xs-From-Web": "false",
    "User-Agent": "com.worldance.drama/49819 (Linux; U; Android 9; in; SM-N976N)",
};

const meloloParams = {
    "iid": "7549249992780367617", "device_id": "6944790948585719298", "aid": "645713", 
    "app_name": "Melolo", "device_platform": "android", "language": "in"
};

async function searchMelolo(query, limit = "5") {
    try {
        const params = { ...meloloParams, query, limit, _rticket: getRticket() };
        const res = await axios.get("https://api.tmtreader.com/i18n_novel/search/page/v1/", { headers: meloloHeaders, params });
        const books = [];
        const searchData = res.data?.data?.search_data || [];
        searchData.forEach(item => {
            if (item.books) {
                item.books.forEach(b => books.push({ series_id: b.book_id, title: b.book_name, thumb_url: b.thumb_url }));
            }
        });
        return books;
    } catch (e) { return []; }
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
    // Gunakan kod ini untuk mengambil teks selepas arahan /sync
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!query) {
        return ctx.reply("❌ Sila masukkan tajuk. Contoh: /sync boss");
    }

    ctx.reply(`⏳ Mencari "${query}" di Melolo...`);
    
    try {
        const books = await searchMelolo(query, "5");
        
        // Log untuk debug (boleh dilihat di log Render)
        console.log(`Hasil carian untuk ${query}:`, books.length);

        if (books.length === 0) {
            return ctx.reply(`❌ Tiada drama dijumpai untuk tajuk "${query}". Cuba tajuk lain.`);
        }

        let count = 0;
        for (let book of books) {
            const wujud = await Film.findOne({ judul: book.title });
            if (!wujud) {
                const vid = await getVideoDetails(book.series_id);
                const url = vid ? await getVideoModel(vid) : null;
                if (url) {
                    await new Film({ 
                        judul: book.title, 
                        deskripsi: "Direct Stream Melolo", 
                        link: url, 
                        thumb: book.thumb_url 
                    }).save();
                    count++;
                }
            }
        }
        ctx.reply(`✅ Berjaya! ${count} drama Melolo telah ditambah.`);
    } catch (e) {
        ctx.reply(`❌ Ralat sistem: ${e.message}`);
    }
});


bot.action('view_vip', (ctx) => ctx.reply("Hubungi Admin untuk VIP."));
bot.action('view_profile', (ctx) => ctx.reply(`ID: ${ctx.from.id}`));

app.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log(`🚀 API Berjalan`));
bot.launch();
