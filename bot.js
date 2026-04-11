const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
const bot = new Telegraf('8700274040:AAE_-p7po7H4SY3Da3Ta4I6qkPKczA09m6I');

// Web server untuk UptimeRobot/Render
app.get('/', (req, res) => res.send('JomNonton Bot Is Alive!'));

// Menu Utama
bot.start((ctx) => {
    return ctx.replyWithMarkdown(
        `👋 *Selamat Datang ke JomNonton Bot*\n\nPlatform tontonan drama terbaik dan Percuma. Klik butang di bawah!`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🎬 Buka Katalog Drama', 'https://kmuhsaid-art.github.io/Bot-dracin/')],
            [Markup.button.url('💰 CARI CUAN (KLIK SINI)', 'https://t.me/+H0HlTVJXRoQ3Y2E1')],
            [Markup.button.url('💬 Hubungi Admin', 'https://t.me/m_asfanraza')]
        ])
    );
});

// Jalankan Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Jalankan Bot
bot.launch()
    .then(() => console.log('✅ Bot Berjalan'))
    .catch(err => console.error('❌ Ralat:', err));

// Matikan bot dengan selamat
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
