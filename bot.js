const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const cors = require('cors');       
const mongoose = require('mongoose'); 

const app = express();
app.use(cors());

// --- 1. SAMBUNGAN MONGODB ---
// Pastikan link di bawah adalah link MongoDB Atlas anda yang betul
mongoose.connect('ISI_LINK_MONGODB_ANDA_DI_SINI', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// --- 2. DEFINISI MODEL ---
// Cukup sekali sahaja tulis ini
const Film = mongoose.model('Film', {
  judul: String,
  deskripsi: String,
  link: String,
  thumb: String
});

const bot = new Telegraf('ISI_TOKEN_BOT_ANDA_DI_SINI');

// --- 3. API UNTUK MINI APP ---
app.get('/api/drama', async (req, res) => {
  try {
    const dramas = await Film.find().sort({ _id: -1 });
    res.json(dramas);
  } catch (err) {
    res.status(500).send(err);
  }
});

// --- 4. PERINTAH BOT ---
bot.start((ctx) => {
  ctx.reply(`👋 Selamat Datang ke @${ctx.botInfo.username}`, Markup.inlineKeyboard([
    [Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')]
  ]));
});

// Tambah arahan lain anda di bawah ini...

// --- 5. SETUP SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API hidup di port ${PORT}`);
});

bot.launch();

const mongoose = require('mongoose');
const http = require('http');

// --- 1. PENGATURAN (Sediakan Bot & Database) ---
const TOKEN = '8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I';
const MONGO_URI = 'mongodb+srv://Hahihu:Blink182@cluster0.i1btqnj.mongodb.net/dracinDB?retryWrites=true&w=majority&appName=Cluster0';
const ADMIN_ID = 1893356626; 

const bot = new Telegraf(TOKEN);

// --- 2. SAMBUNGAN DATABASE ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Berjaya disambung ke MongoDB Atlas!'))
  .catch(err => console.error('❌ Gagal sambung DB:', err));

const Film = mongoose.model('Film', {
  judul: String,
  deskripsi: String,
  link: String,
  thumb: String
});

// --- 3. MENU UTAMA (/start) ---
// --- MENU UTAMA (/start) ---
bot.start((ctx) => {
  const usernameBot = ctx.botInfo.username;
  const mesejStart = 
    `👋 **Selamat Datang ke @${usernameBot}**\n\n` +
    `Satu-satunya tempat untuk anda layan drama China & Korea kegemaran secara percuma!\n\n` +
    `📌 **CARA PENGGUNAAN:**\n` +
    `1. Klik butang **🎬 Katalog Drama** di bawah.\n` +
    `2. Cari drama yang anda minat.\n` +
    `3. Atau taip terus nama drama: \`@${usernameBot} [nama drama]\`.\n\n` +
    `✅ Database: **ONLINE**`;

  ctx.reply(mesejStart, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Katalog Drama', 'https://https://kmuhsaid-art.github.io/Bot-dracin/')],
      [
        Markup.button.callback('👑 Beli VIP', 'vip'),
        Markup.button.callback('👤 Profil Saya', 'profil')
      ],
      [Markup.button.callback('📞 Bantuan', 'help')],
      [
        Markup.button.url('💸 Cari Cuan', 'https://t.me/m_asfanraza'),
        Markup.button.url('🇲🇾 VIP Malaysia', 'https://t.me/m_asfanraza')
      ]
    ])
  });
});

// --- 4. MENU BANTUAN (/help) ---
bot.help((ctx) => {
  const mesejHelp = 
    `❓ **PUSAT BANTUAN BOT**\n\n` +
    `Ada masalah? Jangan risau, kami sedia membantu:\n\n` +
    `🔹 **/start** - Kembali ke menu utama.\n` +
    `🔹 **Cara Cari Drama** - Taip nama bot diikuti tajuk drama.\n` +
    `🔹 **VIP Member** - Untuk akses tanpa iklan.\n\n` +
    `📞 Jika perlukan bantuan lanjut, sila hubungi Admin: @m_asfanraza`;

  ctx.reply(mesejHelp, { parse_mode: 'Markdown' });
});

// --- 5. FITUR ADMIN & INLINE ---
bot.command('add', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("❌ Anda bukan admin!");
  const input = ctx.message.text.split('/add ')[1];
  if (!input) return ctx.reply("Format: /add Judul | Info | Link | Foto");
  const [judul, deskripsi, link, thumb] = input.split('|').map(s => s.trim());
  try {
    const filmBaru = new Film({ judul, deskripsi, link, thumb });
    await filmBaru.save();
    ctx.reply(`✅ Berhasil simpan drama: ${judul}`);
  } catch (err) { ctx.reply("❌ Gagal simpan ke database."); }
});

bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query.toLowerCase();
  try {
    const listFilm = await Film.find({ judul: new RegExp(query, 'i') }).limit(10);
    const results = listFilm.map(f => ({
      type: 'article',
      id: f._id.toString(),
      title: f.judul,
      description: f.deskripsi,
      thumb_url: f.thumb || 'https://placehold.co/100x100?text=No+Photo',
      input_message_content: {
        message_text: `🎬 **Judul:** ${f.judul}\n📝 **Info:** ${f.deskripsi}\n\n🍿 [Klik Untuk Menonton](${f.link})`,
        parse_mode: 'Markdown'
      }
    }));
    return await ctx.answerInlineQuery(results);
  } catch (e) { console.error(e); }
});

// Handler Butang Callback
bot.action('help', (ctx) => ctx.reply(`Sila hubungi Admin kami di @m_asfanraza`));
bot.action('vip', (ctx) => ctx.answerCbQuery('Menu VIP akan dikemaskini!'));
bot.action('profil', (ctx) => ctx.answerCbQuery('Membuka Profil...'));

// --- 6. SERVER & LAUNCH ---
http.createServer((req, res) => {
  res.write('Bot is Running!');
  res.end();
}).listen(process.env.PORT || 8080);

bot.launch();
console.log("Bot Nonton Dracin dah LIVE!");
