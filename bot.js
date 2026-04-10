const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
// Masukkan Token Bot Telegram abang di bawah
const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// --- 1. MENU UTAMA (Muncul bila taip /start) ---
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `👋 *Selamat Datang ke Flux Market Hub*\n\nNikmati ribuan drama Asia secara percuma dan pantas di sini. Klik butang di bawah untuk menonton!`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Buka Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
      [Markup.button.url('💬 Hubungi Admin', 'https://t.me/m_asfanraza')]
    ])
  );
});

// --- 2. JALANKAN SERVER (Untuk Render) ---
// Kita guna Express supaya Render tak anggap bot ni mati
app.get('/', (req, res) => {
    res.send('Bot Dracin Flux Market sedang berjalan...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server sedia di port ${PORT}`);
});

// --- 3. PELANCARAN BOT ---
bot.launch()
  .then(() => console.log("✅ Bot Berjaya Dilancarkan!"))
  .catch(err => console.error("❌ Gagal melancarkan bot:", err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
