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
const TMDB_KEY = '92b7462311961dd095978dab2227d712'; // API Key TMDB anda

// --- 3. API UNTUK MINI APP ---
app.get('/api/drama', async (req, res) => {
  try {
    const dramas = await Film.find().sort({ _id: -1 });
    res.json(dramas);
  } catch (err) {
    res.status(500).send(err);
  }
});

// --- 4. LOGIK BOT TELEGRAM ---

// Paparan Utama
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke @${ctx.botInfo.username}*\n\n` +
    `Katalog drama sedia untuk dilayan! Klik butang di bawah untuk mula menonton.\n\n` +
    `📌 *ARAHAN BARU:*\n` +
    `• Taip /sync - Untuk ambil drama trending automatik.`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [
        Markup.button.callback('💎 Beli VIP', 'view_vip_packages'),
        Markup.button.callback('👤 Profil Saya', 'view_profile')
      ],
      [Markup.button.callback('📞 Bantuan', 'view_help')],
      [
        Markup.button.url('💸 Cari Cuan ↗️', 'https://t.me/m_asfanraza'),
        Markup.button.url('🇲🇾 VIP Malaysia ↗️', 'https://t.me/m_asfanraza')
      ]
    ])
  );
});

// FUNGSI SYNC AUTOMATIK (TMDB)
bot.command('sync', async (ctx) => {
  try {
    ctx.reply("⏳ Sedang menyedut drama trending dari TMDB...");
    const url = `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}`;
    const response = await axios.get(url);
    const dramas = response.data.results;

    let count = 0;
    for (let item of dramas) {
      const wujud = await Film.findOne({ judul: item.name });
      if (!wujud) {
        await new Film({
          judul: item.name,
          deskripsi: item.overview || "Drama trending minggu ini.",
          link: "https://www.dropbox.com/s/sample/video.mp4?dl=1", // Link placeholder
          thumb: `https://image.tmdb.org/t/p/w500${item.poster_path}`
        }).save();
        count++;
      }
    }
    ctx.reply(`✅ Berjaya! ${count} drama trending ditambah.`);
  } catch (err) {
    ctx.reply(`❌ Ralat: ${err.message}`);
  }
});

// Fungsi Menambah Drama Manual
bot.command('add', async (ctx) => {
  const text = ctx.message.text.split('/add ')[1];
  if (!text) return ctx.reply("❌ Guna: /add Judul | Deskripsi | Link | Gambar");
  const [judul, deskripsi, link, thumb] = text.split('|').map(item => item.trim());
  try {
    await new Film({ judul, deskripsi, link, thumb }).save();
    ctx.reply(`✅ Berjaya menambah: ${judul}`);
  } catch (err) { ctx.reply("❌ Gagal simpan ke MongoDB."); }
});

// Pakej VIP
bot.action('view_vip_packages', (ctx) => {
  ctx.editMessageText(`🌟 *PAKEJ PREMIUM VIP* 🌟\n\n• 1 Hari — RM1\n• 1 Bulan — RM25\n• Selamanya — RM500`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.url('👨‍💻 Hubungi Admin', 'https://t.me/m_asfanraza')],
      [Markup.button.callback('⬅️ Kembali', 'back_to_start')]
    ])
  });
});

// Butang Kembali
bot.action('back_to_start', (ctx) => {
  ctx.editMessageText(`👋 Pilih menu utama di bawah:`, Markup.inlineKeyboard([
    [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
    [Markup.button.callback('⬅️ Kembali', 'back_to_start')]
  ]));
});

// Profil & Bantuan
bot.action('view_profile', (ctx) => {
  ctx.editMessageText(`👤 *PROFIL PENGGUNA*\n\n• ID: \`${ctx.from.id}\`\n• Status: 🆓 Percuma`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Kembali', 'back_to_start')]])
  });
});

bot.action('view_help', (ctx) => {
  ctx.editMessageText(`📞 *BANTUAN*\n\nAda masalah? Hubungi admin di @m_asfanraza`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Kembali', 'back_to_start')]])
  });
});

// --- 5. SETUP SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API di port ${PORT}`));

bot.launch();
