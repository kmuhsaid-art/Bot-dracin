const { Telegraf, Markup } = require('telegraf');
const express = require('express'); 
const mongoose = require('mongoose'); 
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

mongoose.connect('mongodb+srv://Hahihu:Blink182@cluster0.i1btqnj.mongodb.net/dracinDB?retryWrites=true&w=majority')
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

const Film = mongoose.model('Film', {
  judul: String,
  deskripsi: String,
  link: String,
  thumb: String
});

async function scrapeSekai(query) {
    try {
        const searchUrl = `https://drama.sansekai.my.id/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' } 
        });
        const $ = cheerio.load(data);
        const results = [];

        // Penambahbaikan: Mencari elemen artikel yang mengandungi drama
        $('article').each((i, el) => {
            const title = $(el).find('h2.entry-title a, .title a').text().trim();
            const link = $(el).find('h2.entry-title a, .title a').attr('href');
            const thumb = $(el).find('img').attr('src');
            
            if (title && link) {
                results.push({ judul: title, link: link, thumb: thumb });
            }
        });

        console.log(`🔍 Dijumpai ${results.length} hasil untuk: ${query}`);
        return results;
    } catch (e) { 
        console.error("❌ Ralat Scraping:", e.message);
        return []; 
    }
}


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
        if (dramas.length === 0) return ctx.reply("❌ Tiada drama ditemui.");
        let count = 0;
        for (let d of dramas) {
            const wujud = await Film.findOne({ judul: d.judul });
            if (!wujud) {
                await new Film({ judul: d.judul, deskripsi: "Sumber: SekaiDrama", link: d.link, thumb: d.thumb }).save();
                count++;
            }
        }
        ctx.reply(count > 0 ? `✅ Berjaya menyedut ${count} drama baharu!` : `ℹ️ Drama sudah ada.`);
    } catch (err) { ctx.reply(`❌ Ralat: ${err.message}`); }
});

app.listen(process.env.PORT || 3000, () => console.log(`🚀 Live`));

// --- FUNGSI PADAM DRAMA ---
bot.command('hapus', async (ctx) => {
    const judul = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!judul) return ctx.reply("❌ Contoh: /hapus Tajuk Drama");

    try {
        const hasil = await Film.deleteOne({ judul: new RegExp(judul, 'i') });
        if (hasil.deletedCount > 0) {
            ctx.reply(`✅ Berjaya memadam drama: "${judul}"`);
        } else {
            ctx.reply(`❌ Drama "${judul}" tidak ditemui dalam database.`);
        }
    } catch (err) {
        ctx.reply(`❌ Ralat: ${err.message}`);
    }
});

bot.launch();

