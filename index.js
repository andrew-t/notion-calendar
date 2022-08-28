const Koa = require('koa'), app = new Koa();

const { getIcs } = require('./notion.js');

app.use(async (ctx, next) => {
	const start = Date.now();
	console.log(ctx.method, ctx.path);
	await next();
	console.log(ctx.status, Date.now() - start);
})

app.use(async ctx => {
	ctx.body = await getIcs();
	ctx.set('content-type', 'text/calendar')
});

app.listen(8765, () => console.log('Listening...'));
