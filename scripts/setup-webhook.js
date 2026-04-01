require('dotenv').config({ path: '../backend/config.env' });

const TelegramBot = require('node-telegram-bot-api');

async function setupWebhook() {
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  
  try {
    // Удаляем текущий webhook
    await bot.deleteWebhook();
    console.log('✅ Текущий webhook удален');
    
    // Устанавливаем новый webhook
    const webhookUrl = process.env.WEBHOOK_URL || 'https://your-domain.com/api/webhook';
    const result = await bot.setWebhook(webhookUrl);
    
    if (result) {
      console.log('✅ Webhook успешно установлен');
      console.log(`🔗 URL: ${webhookUrl}`);
      
      // Получаем информацию о webhook
      const webhookInfo = await bot.getWebhookInfo();
      console.log('📋 Информация о webhook:');
      console.log(JSON.stringify(webhookInfo, null, 2));
    } else {
      console.error('❌ Ошибка установки webhook');
    }
  } catch (error) {
    console.error('❌ Ошибка настройки webhook:', error.message);
  }
  
  process.exit(0);
}

setupWebhook(); 