const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const mongoose = require('mongoose'); 
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// --- MONGODB ---
mongoose.connect('mongodb+srv://Hahihu:Blink182@cluster0.i1btqnj.mongodb.net/dracinDB?retryWrites=true&w=majority')
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

const FilmSchema = new mongoose.Schema({
  judul: String,
  deskripsi: String,
  link: String,
  thumb: String
});
const Film = mongoose.model('Film', FilmSchema);

async function scrapeGoodShort(query) {
    try {
        const searchUrl = `https://www.goodshort.com/search?keyword=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });
        const $ = cheerio.load(data);
        const results = [];

        // Kita cuba cari guna semua selector yang mungkin (Kad, List, atau Grid)
        $('.book-item, .search-result-item, [class*="bookItem"], [class*="searchItem"]').each((i, el) => {
            const title = $(el).find('[class*="name"], [class*="title"], h3').first().text().trim();
            let link = $(el).find('a').first().attr('href');
            let thumb = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

            if (title && link) {
                if (!link.startsWith('http')) link = `https://www.goodshort.com${link}`;
                results.push({ judul: title, link: link, thumb: thumb });
            }
        });

        console.log(`Debug: Jumpa ${results.length} hasil.`); // Abang boleh tengok kat log Render
        return results;
    } catch (e) {
        console.log("Ralat Scraper:", e.message);
        return [];
    }
}


// --- COMMAND BARU /FIND ---
bot.command('find', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!query) return ctx.reply("❌ Contoh: /find boss");

    ctx.reply(`🔍 Mencari "${query}" di GoodShort...`);
    const dramas = await scrapeGoodShort(query);
    
    if (dramas.length === 0) return ctx.reply("❌ Tiada drama ditemui di GoodShort.");

    let count = 0;
    for (let d of dramas) {
        const wujud = await Film.findOne({ judul: d.judul });
        if (!wujud) {
            await new Film({
                judul: d.judul,
                link: d.link,
                thumb: d.thumb,
                deskripsi: "Sumber: GoodShort"
            }).save();
            count++;
        }
    }
    ctx.reply(count > 0 ? `✅ Berjaya auto-sync ${count} drama ke katalog!` : `ℹ️ Drama sudah sedia ada.`);
});

bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke Flux Market Hub*\n\nPlatform tontonan drama terbaik dan peluang menjana pendapatan. Klik butang di bawah untuk bermula!`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Buka Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [
        Markup.button.callback('💎 Beli VIP', 'buy_vip'),
        Markup.button.callback('💰 Cari Cuan', 'sembang')
      ],
      [
        Markup.button.callback('👤 Profil', 'my_profile'),
        Markup.button.callback('❓ Bantuan', 'help_info')
      ]
    ])
  );
});

// Tambah aksi untuk butang (Contoh)
bot.action('help_info', (ctx) => ctx.reply("Sila hubungi @m_asfanraza untuk bantuan teknikal."));

bot.action('sembang', (ctx) => ctx.reply ("https://t.me/m_asfanraza"));

bot.action('buy_vip', (ctx) => ctx.reply("Pek VIP: RM10/bulan. Hubungi admin @m_asfanraza untuk pengaktifan."));

bot.command('sync', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!query) return ctx.reply("❌ Contoh: /sync gadis");

    ctx.reply(`⏳ Mencari "${query}"...`);
    const dramas = await scrapeSekai(query);
    
    if (dramas.length === 0) return ctx.reply("❌ Tiada drama ditemui di website.");

    let count = 0;
    for (let d of dramas) {
        // Guna findOne (Bukan find) untuk check data sedia ada
        const wujud = await Film.findOne({ judul: d.judul });
        if (!wujud) {
            await new Film({
                judul: d.judul,
                deskripsi: "Sumber: SekaiDrama",
                link: d.link,
                thumb: d.thumb
            }).save();
            count++;
        }
    }
    ctx.reply(count > 0 ? `✅ Berjaya simpan ${count} drama ke MongoDB!` : `ℹ️ Drama sudah ada dalam database.`);
});

// --- API UNTUK MINI APP ---
app.get('/api/films', async (req, res) => {
    const data = await Film.find();
    res.json(data);
});

app.listen(process.env.PORT || 3000, () => console.log(`🚀 Live`));
bot.launch();
