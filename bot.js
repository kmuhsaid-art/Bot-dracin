const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// Gunakan format link yang lebih ringkas jika ralat queryTxt masih berlaku
mongoose.connect('mongodb://Hahihu:Blink182@cluster0-shard-00-00.i1btqnj.mongodb.net:27017,cluster0-shard-00-01.i1btqnj.mongodb.net:27017,cluster0-shard-00-02.i1btqnj.mongodb.net:27017/dracinDB?ssl=true&replicaSet=atlas-xxxxxx-shard-0&authSource=admin&retryWrites=true&w=majority')


const Film = mongoose.model('Film', {
  judul: String,
  link: String,
  thumb: String,
  deskripsi: String
});

// --- MENU UTAMA (START) ---
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke Flux Market Hub*\n\nPlatform tontonan drama terbaik dan peluang menjana pendapatan. Klik butang di bawah untuk bermula!`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Buka Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [
        Markup.button.callback('💎 Beli VIP', 'buy_vip'),
        Markup.button.callback('💰 Cari Cuan', 'make_money')
      ],
      [
        Markup.button.callback('👤 Profil', 'my_profile'),
        Markup.button.callback('❓ Bantuan', 'help_info')
      ]
    ])
  );
});

// --- FUNGSI TAMBAH (PELAN B) ---
bot.command('tambah', async (ctx) => {
    try {
        const text = ctx.message.text.split(' ').slice(1).join(' ');
        if (!text.includes('|')) {
            return ctx.reply("❌ Format Salah! Contoh:\n/tambah Judul | Link | Gambar");
        }

        const [judul, link, thumb] = text.split('|').map(s => s.trim());

        const filmBaru = new Film({
            judul: judul,
            link: link,
            thumb: thumb,
            deskripsi: "Koleksi Flux Market"
        });

        await filmBaru.save();
        ctx.reply(`✅ BERJAYA DISIMPAN!\n\n🎬 ${judul}\n\nSila semak Katalog abang sekarang.`);
    } catch (e) {
        console.error("Ralat simpan:", e);
        ctx.reply("❌ Gagal simpan ke database. Sila check log Render.");
    }
});

// --- API UNTUK MINI APP ---
app.get('/api/films', async (req, res) => {
    try {
        const data = await Film.find().sort({ _id: -1 }); // Yang baru masuk kat atas
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- BALASAN BUTANG CALLBACK ---
bot.on('callback_query', (ctx) => {
    const data = ctx.callbackQuery.data;
    if (data === 'help_info') ctx.reply("Sila hubungi @admin untuk bantuan.");
    if (data === 'buy_vip') ctx.reply("Hubungi admin untuk beli VIP.");
    ctx.answerCbQuery();
});

// --- JALANKAN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));

bot.launch()
  .then(() => console.log("🤖 Bot sedang memerhati..."))
  .catch(err => console.error("❌ Bot gagal launch:", err));
