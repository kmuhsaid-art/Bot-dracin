const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const mongoose = require('mongoose'); 
const axios = require('axios');
const cheerio = require('cheerio'); // Tambah library ini untuk membaca HTML

const app = express();
const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// --- SAMBUNGAN MONGODB ---
mongoose.connect('mongodb+srv://Hahihu:Blink182@cluster0.i1btqnj.mongodb.net/dracinDB?retryWrites=true&w=majority')
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

const Film = mongoose.model('Film', {
  judul: String,
  deskripsi: String,
  link: String,
  thumb: String
});

// --- FUNGSI SCRAPING SEKAIDRAMA ---
async function scrapeSekai(query) {
    try {
        // Mencari drama berdasarkan query di website sansekai
        const searchUrl = `https://drama.sansekai.my.id/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(data);
        const results = [];

        $('.result-item').each((i, el) => {
            const title = $(el).find('.title a').text().trim();
            const link = $(el).find('.title a').attr('href');
            const thumb = $(el).find('img').attr('src');
            
            if (title && link) {
                results.push({ judul: title, link: link, thumb: thumb });
            }
        });
        return results;
    } catch (e) {
        console.error("❌ Ralat Scraping:", e.message);
        return [];
    }
}

// --- LOGIK BOT TELEGRAM ---
bot.start((ctx) => {
  ctx.replyWithMarkdown(`👋 *Bot Dracin Terkini*\n\nGunakan /sync <tajuk> untuk menyedut drama dari SekaiDrama.`,
    Markup.inlineKeyboard([[Markup.button.webApp('🎬 Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')]])
  );
});

bot.command('sync', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!query) return ctx.reply("❌ Contoh: /sync gadis");

    ctx.reply(`⏳ Mencari "${query}" di SekaiDrama...`);
    
    try {
        const dramas = await scrapeSekai(query);
        if (dramas.length === 0) return ctx.reply("❌ Tiada drama ditemui di website tersebut.");

        let count = 0;
        for (let d of dramas) {
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
        ctx.reply(count > 0 ? `✅ Berjaya menyedut ${count} drama baharu!` : `ℹ️ Semua drama sudah ada dalam katalog.`);
    } catch (err) { ctx.reply(`❌ Ralat: ${err.message}`); }
});

app.listen(process.env.PORT || 3000, () => console.log(`🚀 Bot Live`));
bot.launch();

