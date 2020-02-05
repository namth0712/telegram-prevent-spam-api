const dotenv = require('dotenv');
dotenv.config();
const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

const { isUrl } = require('./utils');
const teleOpts = {
  preventUrl: true,
  preventPhoto: false,
};

const cacheData = {
  /*
  -1111111111:{
    admins:
    adminIds:
  }
  */
};

bot.use(function(ctx, next) {
  const chatId = ctx.chat.id;
  if (!chatId || ctx.chat.id > 0) {
    return next(ctx);
  }

  if (cacheData[chatId]) {
    // set data
    const cacheAdmins = cacheData[chatId];
    if (cacheAdmins.lastUpdate > Date.now() - 60000) {
      console.log('===useCache===');
      ctx.from._isAdmin = cacheAdmins.adminIds.indexOf(ctx.from.id) !== -1;
      return next(ctx);
    }
  }

  return bot.telegram
    .getChatAdministrators(ctx.chat.id)
    .then(function(data) {
      if (!data || !data.length) {
        return;
      }
      const adminIds = [];
      for (let i = 0; i < data.length; i++) {
        adminIds.push(data[i].user.id);
      }
      cacheData[chatId] = {
        lastUpdate: Date.now(),
        admins: data,
        adminIds,
      };
      ctx.from._isAdmin = adminIds.indexOf(ctx.from.id) !== -1;
    })
    .catch(console.log)
    .then(_ => next(ctx));
});

const checkGroup = (ctx, optionName) => {
  const {
    message: { chat },
  } = ctx;
  if (!teleOpts[optionName]) {
    return false;
  }
  return true;
};

bot.on('text', ctx => {
  if (!checkGroup(ctx, 'preventUrl')) {
    return true;
  }
  const {
    message: { text },
  } = ctx;
  // check member is admin or not
  if (!ctx.from._isAdmin && isUrl(text)) {
    // Delete message
    bot.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
    // Kick member
    bot.telegram.kickChatMember(ctx.message.chat.id, ctx.message.from.id);
  }
  return true;
});

bot.on('photo', ctx => {
  if (!checkGroup(ctx, 'preventPhoto')) {
    return true;
  }
  const {
    message: { photo },
  } = ctx;
  // check member is admin or not
  if (!ctx.from._isAdmin && photo && photo.length) {
    // Delete message
    bot.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
    // Kick member
    bot.telegram.kickChatMember(ctx.message.chat.id, ctx.message.from.id);
  }
  return true;
});

bot.startPolling();
