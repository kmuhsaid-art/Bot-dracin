const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const cors = require('cors');       
const mongoose = require('mongoose'); 
const axios = require('axios'); // Pastikan sudah install: npm install axios

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
    `Katalog drama sedia untuk dilayan! Klik butang di bawah untuk mula menonton.`,
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

// --- FUNGSI SYNC MELOLO (GABUNGAN BARU) ---
bot.command('sync_melolo', async (ctx) => {
  try {
    ctx.reply("⏳ Sedang mencuba pautan alternatif Melolo...");
    
    // Kita gunakan endpoint 'search' dengan kata kunci 'Drama' untuk pastikan ada data keluar
    const response = await axios.get('https://melolo-api-azure.vercel.app/api/melolo/search?query=Drama', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    // Kita cuba cari data dalam 'results' atau 'data.books'
    const dramas = response.data?.results || response.data?.data?.books; 

    if (!dramas || dramas.length === 0) {
      return ctx.reply("❌ Server Melolo masih membalas dengan data kosong. Mungkin server sedang diselenggara.");
    }

    let count = 0;
    for (let item of dramas) {
      const tajuk = item.title || item.book_name;
      const gambar = item.thumb_url || item.cover || item.poster;
      
      const wujud = await Film.findOne({ judul: tajuk });
      
      if (!wujud && tajuk) {
        await new Film({
          judul: tajuk,
          deskripsi: item.abstract || "Drama pendek menarik dari Melolo",
          link: gambar, // Buat masa ini kita guna gambar sebagai link tontonan sementara
          thumb: gambar
        }).save();
        count++;
      }
    }
    ctx.reply(`✅ Berjaya! ${count} drama telah ditarik masuk ke Katalog.`);
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

// Bot Action (VIP, Profile, Help)
bot.action('view_vip_packages', (ctx) => {
  ctx.editMessageText(`🌟 *PAKEJ PREMIUM VIP* 🌟\n\n• 1 Hari — RM1\n• Selamanya — RM500`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.url('👨‍💻 Hubungi Admin', 'https://t.me/m_asfanraza')],
      [Markup.button.callback('⬅️ Kembali', 'back_to_start')]
    ])
  });
});

bot.action('back_to_start', (ctx) => {
  ctx.editMessageText(`👋 Pilih menu utama di bawah:`, Markup.inlineKeyboard([
    [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
    [Markup.button.callback('⬅️ Kembali', 'back_to_start')]
  ]));
});
//tes
// --- 5. SETUP SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API di port ${PORT}`));

bot.launch();
