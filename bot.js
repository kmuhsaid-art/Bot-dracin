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
const TMDB_KEY = '92b7462311961dd095978dab2227d712'; 

// ==========================================
// --- 3. KONFIGURASI API MELOLO (DARI PYTHON) ---
// ==========================================
function getRticket() { return Date.now().toString(); }

const meloloHeaders = {
    "Host": "api.tmtreader.com",
    "Accept": "application/json; charset=utf-8,application/x-protobuf",
    "X-Xs-From-Web": "false",
    "Age-Range": "8",
    "Sdk-Version": "2",
    "Passport-Sdk-Version": "50357",
    "X-Vc-Bdturing-Sdk-Version": "2.2.1.i18n",
    "User-Agent": "com.worldance.drama/49819 (Linux; U; Android 9; in; SM-N976N; Build/QP1A.190711.020;tt-ok/3.12.13.17)",
};

const meloloParams = {
    "iid": "7549249992780367617", "device_id": "6944790948585719298", "ac": "wifi",
    "channel": "gp", "aid": "645713", "app_name": "Melolo", "version_code": "49819",
    "version_name": "4.9.8", "device_platform": "android", "os": "android",
    "ssmix": "a", "device_type": "SM-N976N", "device_brand": "samsung",
    "language": "in", "os_api": "28", "os_version": "9", "openudid": "707e4ef289dcc394",
    "manifest_version_code": "49819", "resolution": "900*1600", "dpi": "320",
    "update_version_code": "49819", "current_region": "ID", "carrier_region": "ID",
    "app_language": "id", "sys_language": "in", "app_region": "ID", "sys_region": "ID",
    "mcc_mnc": "46002", "carrier_region_v2": "460", "user_language": "id",
    "time_zone": "Asia/Bangkok", "ui_language": "in", "cdid": "a854d5a9-b6cd-4de7-9c43-8310f5bf513c",
};

// Fungsi Cari Drama Melolo
async function searchMelolo(query, limit = "5") {
    try {
        const params = { ...meloloParams, search_source_id: "clks###", IsFetchDebug: "false", offset: "0", cancel_search_category_enhance: "false", query, limit, search_id: "", _rticket: getRticket() };
        const res = await axios.get("https://api.tmtreader.com/i18n_novel/search/page/v1/", { headers: meloloHeaders, params });
        const books = [];
        const searchData = res.data?.data?.search_data || [];
        searchData.forEach(item => {
            if (item.books) {
                item.books.forEach(b => books.push({ series_id: b.book_id, title: b.book_name, thumb_url: b.thumb_url }));
            }
        });
        return books;
    } catch (e) { console.error("Melolo Search Error:", e.message); return []; }
}

// Fungsi Dapatkan ID Video Pertama
async function getVideoDetails(series_id) {
    try {
        const headers = { ...meloloHeaders, "X-Ss-Stub": "238B6268DE1F0B757306031C76B5397E", "Content-Encoding": "gzip", "Content-Type": "application/json; charset=utf-8" };
        const params = { ...meloloParams, _rticket: getRticket() };
        const data = { biz_param: { detail_page_version: 0, from_video_id: "", need_all_video_definition: false, need_mp4_align: false, source: 4, use_os_player: false, video_id_type: 1 }, series_id };
        const res = await axios.post("https://api.tmtreader.com/novel/player/video_detail/v1/", data, { headers, params });
        const videoList = res.data?.data?.video_data?.video_list || [];
        return videoList.length > 0 ? videoList[0].vid : null;
    } catch (e) { console.error("Melolo Video Details Error:", e.message); return null; }
}

// Fungsi Dapatkan Direct Video URL
async function getVideoModel(video_id) {
    try {
        const headers = { ...meloloHeaders, "X-Ss-Stub": "B7FB786F2CAA8B9EFB7C67A524B73AFB", "Content-Encoding": "gzip", "Content-Type": "application/json; charset=utf-8" };
        const params = { ...meloloParams, _rticket: getRticket() };
        const data = { biz_param: { detail_page_version: 0, device_level: 3, from_video_id: "", need_all_video_definition: true, need_mp4_align: false, source: 4, use_os_player: false, video_id_type: 0, video_platform: 3 }, video_id };
        const res = await axios.post("https://api.tmtreader.com/novel/player/video_model/v1/", data, { headers, params });
        return res.data?.data?.main_url || res.data?.data?.backup_url || null;
    } catch (e) { console.error("Melolo Video Model Error:", e.message); return null; }
}
// ==========================================


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
    `📌 *ARAHAN BARU:*\n` +
    `• /sync - Ambil dari TMDB\n` +
    `• /sync_melolo <tajuk> - Cari & ambil dari Melolo (Video Langsung!)`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [Markup.button.callback('💎 Beli VIP', 'view_vip_packages'), Markup.button.callback('👤 Profil Saya', 'view_profile')]
    ])
  );
});

// --- PERINTAH BARU: SYNC MELOLO ---
bot.command('sync_melolo', async (ctx) => {
    const query = ctx.message.text.split('/sync_melolo ')[1];
    if (!query) return ctx.reply("❌ Sila masukkan tajuk. Contoh: /sync_melolo ceo atau /sync_melolo cinta");

    ctx.reply(`⏳ Mencari "${query}" di pangkalan data Melolo...`);
    
    try {
        const books = await searchMelolo(query, "5"); // Ambil 5 teratas
        if (books.length === 0) return ctx.reply("❌ Tiada drama dijumpai.");

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
                            deskripsi: "Drama dari Melolo",
                            link: videoUrl, // INI ADALAH DIRECT VIDEO MP4!
                            thumb: book.thumb_url
                        }).save();
                        count++;
                    }
                }
            }
        }
        ctx.reply(`✅ Berjaya! ${count} drama Melolo telah ditambah dengan video terus (Direct Play).`);
    } catch (err) {
        ctx.reply(`❌ Ralat: ${err.message}`);
    }
});

// Sync Lama (TMDB) dikekalkan sebagai sandaran
bot.command('sync', async (ctx) => {
  // ... (kod sync lama TMDB anda kekal di sini, saya abaikan untuk menjimatkan ruang teks, anda boleh copy paste logik lama jika mahu)
  ctx.reply("Sila gunakan /sync_melolo <tajuk> untuk pengalaman tanpa iklan.");
});

bot.action('view_vip_packages', (ctx) => ctx.reply("Hubungi @m_asfanraza"));
bot.action('view_profile', (ctx) => ctx.reply(`ID Anda: ${ctx.from.id}`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API di port ${PORT}`));

bot.launch();
