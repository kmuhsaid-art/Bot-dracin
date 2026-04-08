const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const cors = require('cors');       
const mongoose = require('mongoose'); 

const app = express();
app.use(cors());

// Gantikan 'KATA_LALUAN_ANDA' dengan password user 'Hahihu'
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

const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I'); // Pastikan Token ini betul

// --- 3. API UNTUK MINI APP ---
app.get('/api/drama', async (req, res) => {
  try {
    const dramas = await Film.find().sort({ _id: -1 });
    res.json(dramas);
  } catch (err) {
    res.status(500).send(err);
  }
});

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
      [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')]
    ])
  );
});

// Fungsi Menambah Drama (/add judul | deskripsi | link | gambar)
bot.command('add', async (ctx) => {
  const text = ctx.message.text.split('/add ')[1];
  if (!text) return ctx.reply("❌ Format salah! Guna: /add Judul | Deskripsi | Link | LinkGambar");

  const [judul, deskripsi, link, thumb] = text.split('|').map(item => item.trim());

  if (!judul || !deskripsi || !link || !thumb) {
    return ctx.reply("❌ Maklumat tidak lengkap! Pastikan ada 4 bahagian dipisahkan dengan '|'");
  }

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

bot.launch();
