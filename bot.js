const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
// Token Bot abang
const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// --- MENU UTAMA ---
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke Cidrama Lovers Hub*\n\nPlatform tontonan drama terbaik dan peluang menjana pendapatan. Klik butang di bawah untuk bermula!`,
    Markup.inlineKeyboard([
      // Baris 1: Buka Mini App Drama
      [Markup.button.webApp('🎬 Buka Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      
      // Baris 2: Butang Cari Cuan (Gantikan link di bawah dengan link grup abang)
      [Markup.button.url('💰 CARI CUAN (GRUP TELEGRAM)', 'https://t.me/+H0HlTVJXRoQ3Y2E1')], 
      
      // Baris 3: Hubungi Admin
      [Markup.button.url('💬 Hubungi Admin', 'https://t.me/m_asfanraza')]
    ])
  );
});

// --- SERVER UNTUK RENDER ---
app.get('/', (req, res) => {
    res.send('Bot Flux Market Aktif!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
});

bot.launch()
  .then(() => console.log("✅ Bot Berjaya Dilancarkan!"))
  .catch(err => console.error("❌ Gagal:", err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
