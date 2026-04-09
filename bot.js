const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const mongoose = require('mongoose'); 
const cors = require('cors');

const app = express();
app.use(cors());
const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// --- SAMBUNGAN MONGODB ---
mongoose.connect('mongodb+srv://Hahihu:Blink182@cluster0.i1btqnj.mongodb.net/dracinDB?retryWrites=true&w=majority')
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

const Film = mongoose.model('Film', {
  judul: String,
  link: String,
  thumb: String,
  deskripsi: String
});

// --- COMMAND BOT ---
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke Flux Market*\n\nKlik butang di bawah untuk melihat katalog drama terkini atau gunakan arahan admin.`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Buka Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')]
    ])
  );
});


// Fungsi Tambah Manual (Guna pipe | sebagai pemisah)
bot.command('tambah', async (ctx) => {
    const input = ctx.message.text.split(' ').slice(1).join(' ');
    if (!input.includes('|')) {
        return ctx.reply("❌ Format: /tambah Tajuk | Link | Link_Gambar");
    }

    const [judul, link, thumb] = input.split('|').map(s => s.trim());

    try {
        await new Film({
            judul: judul,
            link: link,
            thumb: thumb || "https://via.placeholder.com/150",
            deskripsi: "Drama pilihan Admin"
        }).save();
        ctx.reply(`✅ Berjaya disimpan: ${judul}`);
    } catch (err) {
        ctx.reply(`❌ Ralat: ${err.message}`);
    }
});

// Fungsi Hapus
bot.command('hapus', async (ctx) => {
    const judul = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!judul) return ctx.reply("❌ Contoh: /hapus Gadis Titisan");

    try {
        const hasil = await Film.deleteOne({ judul: new RegExp(judul, 'i') });
        if (hasil.deletedCount > 0) {
            ctx.reply(`🗑️ Berjaya padam: ${judul}`);
        } else {
            ctx.reply(`❌ Drama tidak ditemui.`);
        }
    } catch (err) {
        ctx.reply(`❌ Ralat: ${err.message}`);
    }
});

// Fungsi List
bot.command('list', async (ctx) => {
    const films = await Film.find().limit(10);
    if (films.length === 0) return ctx.reply("Database kosong.");
    let msg = "🎬 *Senarai Drama Terkini:*\n\n";
    films.forEach(f => msg += `• ${f.judul}\n`);
    ctx.replyWithMarkdown(msg);
});

// --- API UNTUK MINI APP (GITHUB PAGES) ---
app.get('/api/films', async (req, res) => {
    try {
        const data = await Film.find();
        res.json(data);
    } catch (err) {
        res.status(500).json({ ralat: err.message });
    }
});

app.listen(process.env.PORT || 3000, () => console.log(`🚀 Server Bot & API Live`));
bot.launch();
