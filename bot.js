const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const cors = require('cors');       
const mongoose = require('mongoose'); 

const app = express();
// Pastikan cors diletakkan SEBELUM app.get('/api/drama')
app.use(cors()); 
app.use(express.json()); // Tambah ini juga untuk keselamatan data

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

// Paparan Utama (Menu Grid)
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke @${ctx.botInfo.username}*\n\n` +
    `Katalog drama sedia untuk dilayan! Klik butang di bawah untuk mula menonton.\n\n` +
    `📌 *CARA PENGGUNAAN:*\n` +
    `1️⃣ Klik butang *🎬 Katalog Drama* di bawah.\n` +
    `2️⃣ Cari drama yang anda minat.\n` +
    `3️⃣ Atau guna fungsi carian: \`@${ctx.botInfo.username} [nama drama]\``,
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

// FUNGSI PAKEJ VIP (Harga yang anda berikan)
bot.action('view_vip_packages', (ctx) => {
  const hargaVIP = 
    `🌟 *PAKEJ PREMIUM VIP* 🌟\n\n` +
    `🎟️ *PILIHAN PAKEJ:* \n` +
    `• 1 Hari — RM1\n` +
    `• 3 Hari — RM2\n` +
    `• 1 Minggu — RM5\n` +
    `• 1 Bulan — RM25\n` +
    `• 3 Bulan — RM60\n` +
    `• 1 Tahun — RM250\n` +
    `• *Selamanya — RM500*\n\n` +
    `📌 *Cara Langgan:* Klik butang "Hubungi Admin" di bawah.`;

  ctx.editMessageText(hargaVIP, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.url('👨‍💻 Hubungi Admin (Bayar)', 'https://t.me/m_asfanraza')],
      [Markup.button.callback('⬅️ Kembali', 'back_to_start')]
    ])
  });
});

// Fungsi Butang Kembali
bot.action('back_to_start', (ctx) => {
  ctx.editMessageText(`👋 Pilih menu utama di bawah:`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [
        Markup.button.callback('👑 Beli VIP', 'view_vip_packages'),
        Markup.button.callback('👤 Profil Saya', 'view_profile')
      ],
      [Markup.button.callback('📞 Bantuan', 'view_help')],
      [
        Markup.button.url('💸 Cari Cuan ↗️', 'https://t.me/m_asfanraza'),
        Markup.button.url('🇲🇾 VIP Malaysia ↗️', 'https://t.me/m_asfanraza')
      ]
    ])
  });
});

// Tambahan Fungsi Profil & Bantuan
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

// Fungsi Menambah Drama
bot.command('add', async (ctx) => {
  const text = ctx.message.text.split('/add ')[1];
  if (!text) return ctx.reply("❌ Guna: /add Judul | Deskripsi | Link | Gambar");
  const [judul, deskripsi, link, thumb] = text.split('|').map(item => item.trim());
  try {
    await new Film({ judul, deskripsi, link, thumb }).save();
    ctx.reply(`✅ Berjaya menambah: ${judul}`);
  } catch (err) { ctx.reply("❌ Gagal simpan ke MongoDB."); }
});

// --- 5. SETUP SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API di port ${PORT}`));

bot.launch();
