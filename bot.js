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

// --- SCRAPER UNTUK GOODSHORT ---
async function scrapeGoodShort(query) {
    try {
        // GoodShort guna struktur URL carian macam ni
        const searchUrl = `https://www.goodshort.com/search?keyword=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const $ = cheerio.load(data);
        const results = [];

        // Mencari kad drama dalam senarai carian GoodShort
        $('.book-item, .search-result-item').each((i, el) => {
            const title = $(el).find('.book-name, h3').text().trim();
            let link = $(el).find('a').attr('href');
            const thumb = $(el).find('img').attr('src');

            // Pastikan link lengkap
            if (link && !link.startsWith('http')) {
                link = `https://www.goodshort.com${link}`;
            }

            if (title && link) {
                results.push({ judul: title, link: link, thumb: thumb });
            }
        });
        return results;
    } catch (e) {
        console.log("Ralat GoodShort:", e.message);
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

// --- BOT COMMANDS ---
bot.start((ctx) => ctx.reply("Bot Aktif! Guna /sync <tajuk>"));

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
