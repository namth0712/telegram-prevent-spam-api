const dotenv = require('dotenv');
dotenv.config();
const Telegraf = require('telegraf');
console.log('===process.env.BOT_TOKEN===', process.env.BOT_TOKEN);
const bot = new Telegraf(process.env.BOT_TOKEN);

const isURL = str => {
  return new RegExp(
    '([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?',
  ).test(str);
};

bot.use(function(ctx, next) {
  if (ctx.chat.id > 0) return next();

  return bot.telegram
    .getChatAdministrators(ctx.chat.id)
    .then(function(data) {
      if (!data || !data.length) return;
      ctx.chat._admins = data;
      ctx.from._is_in_admin_list = data.some(
        adm => adm.user.id === ctx.from.id,
      );
    })
    .catch(console.log)
    .then(_ => next(ctx));
});

bot.on(['text', 'photo'], ctx => {
  const {
    message: { text },
  } = ctx;
  // check member is admin or not
  if (ctx.from._is_in_admin_list) {
    return true;
  } else {
    if (isURL(text)) {
      // Delete message
      bot.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
      // Kick member
      bot.telegram.kickChatMember(ctx.message.chat.id, ctx.message.from.id);
    }
    return true;
  }
});
bot.startPolling();
