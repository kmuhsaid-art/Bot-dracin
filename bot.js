const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
// Token Bot abang
const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// --- MENU UTAMA JOMNONTON BOT ---
bot.start((ctx) => {
  try {
    ctx.replyWithMarkdown(
      `👋 *Selamat Datang ke JomNonton Bot*\n\nPlatform tontonan drama terbaik dan Percuma. Klik butang di bawah!`,
      Markup.inlineKeyboard([
        // Baris 1: Buka Mini App Drama
        [Markup.button.webApp('🎬 Buka Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
        
        // Baris 2: Butang Cari Cuan dengan link grup baru abang
        [Markup.button.url('💰 CARI CUAN (KLIK SINI)', 'https://t.me/+H0HlTVJXRoQ3Y2E1')], 
        
        // Baris 3: Hubungi Admin
        [Markup.button.url('💬 Hubungi Admin', 'https://t.me/m_asfanraza')]
      ])
    );
  } catch (e) {
    console.error("Ralat pada menu utama:", e);
  }
});

// --- SERVER UNTUK RENDER ---
app.get('/', (req, res) => {
    res.send('JomNonton Bot is Active!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 JomNonton Bot sedia di port ${PORT}`);
});

// --- PELANCARAN BOT ---
bot.launch()
  .then(() => console.log("✅ JomNonton Bot Berjaya Dilancarkan!"))
  .catch(err => console.error("❌ Gagal Launch:", err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
