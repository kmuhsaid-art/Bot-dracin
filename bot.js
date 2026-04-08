const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const cors = require('cors');       
const mongoose = require('mongoose'); 

const app = express();
app.use(cors());

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

// Paparan Utama (Start)
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke @${ctx.botInfo.username}*\n\n` +
    `Katalog drama sedia untuk dilayan! Klik butang di bawah untuk mula menonton.\n\n` +
    `Satu-satunya tempat untuk anda layan drama China & Korea kegemaran secara percuma!\n\n` +
    `📌 *CARA PENGGUNAAN:*\n` +
    `1️⃣ Klik butang *🎬 Katalog Drama* di bawah.\n` +
    `2️⃣ Cari drama yang anda minat.\n` +
    `3️⃣ Atau guna fungsi carian: \`@${ctx.botInfo.username} [nama drama]\``,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [Markup.button.callback('💎 Beli VIP', 'view_vip_packages')]
    ])
  );
});

// Fungsi untuk memaparkan pakej VIP
bot.action('view_vip_packages', (ctx) => {
  const hargaVIP = 
    `🌟 *PAKEJ PREMIUM VIP* 🌟\n\n` +
    `Nikmati akses tanpa had kepada semua drama China & Korea terbaru!\n\n` +
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

// Fungsi butang kembali
bot.action('back_to_start', (ctx) => {
  ctx.editMessageText(`👋 *Selamat Datang semula!*\n\nSila pilih menu di bawah:`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [Markup.button.callback('💎 Beli VIP', 'view_vip_packages')]
    ])
  });
});

// Fungsi Menambah Drama
bot.command('add', async (ctx) => {
  const text = ctx.message.text.split('/add ')[1];
  if (!text) return ctx.reply("❌ Format salah! Guna: /add Judul | Deskripsi | Link | LinkGambar");

  const parts = text.split('|').map(item => item.trim());
  if (parts.length < 4) {
    return ctx.reply("❌ Maklumat tidak lengkap! Pastikan ada 4 bahagian dipisahkan dengan '|'");
  }

  const [judul, deskripsi, link, thumb] = parts;

  try {
    const dramaBaru = new Film({ judul, deskripsi, link, thumb });
    await dramaBaru.save();
    ctx.reply(`✅ Berjaya menambah: ${judul}`);
  } catch (err) {
    ctx.reply("❌ Gagal menyimpan data ke MongoDB.");
  }
});

// --- 5. SETUP SERVER & PORT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API hidup di port ${PORT}`);
});

bot.launch().then(() => {
  console.log("🤖 Bot sedang berjalan...");
});
