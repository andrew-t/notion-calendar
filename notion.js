const { Client } = require('@notionhq/client');
const { databases, apiKey } = require('./creds.json');
const ics = require('ics');
const RateLimiter = require('./rate-limit');

const notion = new Client({ auth: apiKey });
const rate = new RateLimiter();

const oneDay = 1000 * 60 * 60 * 24,
	sixMonths = oneDay * 30 * 6;


class Database {
	constructor(id) {
		this.id = id;
	}

	async getPages(filter) {
		const pages = await rate.run(() => notion.databases.query({
			database_id: this.id,
			filter
		}));
		return pages.results.map(page => new Page(page, this));
	}
}

class Page {
	constructor(json, database) {
		this.json = json;
		this.id = json.id;
		this.props = json.properties;
		this.getters = {};
		this.database = database;
	}

	async getPropById(id) {
		if (!this.getters[id])
			this.getters[id] = rate.run(() => notion.pages.properties.retrieve({
				page_id: this.id,
				property_id: id
			}));
		return await this.getters[id];
	}

	async getPropByName(name) {
		return await this.getPropById(this.props[name].id);
	}
}

async function getEventList({ id, prop, filter }) {
	const dateFilter = {
		property: prop,
		date: {
			on_or_after: new Date(Date.now() - sixMonths).toISOString().substring(0, 10),
		}
	};
	return await new Database(id).getPages(filter ? { and: [ filter, dateFilter ] } : dateFilter);
}

function formatDate(date, isEnd) {
	if (isEnd) {
	const allDay = date.length <= 10;
		date = new Date(new Date(date).getTime() + oneDay).toISOString();
		if (allDay) date = date.substring(0, 10);
	}
	return date.substring(0, 15).split(/[\-T:]/g).map(x => parseInt(x, 10));
}

async function getIcsEvents() {
	const events = [];
	for (const db of databases)
		for (const event of await getEventList(db)) {
			const title = (await event.getPropByName('Name')).results[0]?.title.text.content ?? 'Unnamed event',
				date = (await event.getPropByName(db.prop)).date;
			events.push({
				productId: db.id,
				uid: event.id,
				startOutputType: 'local',
				start: formatDate(date.start, false),
				end: formatDate(date.end ?? date.start, true),
				title,
				alarms: [],
				description: event.url,
				url: event.url
			});
		}
	return events;
}

async function getIcs() {
	const events = await getIcsEvents();
	const { error, value } = ics.createEvents(events);
	if (error) throw error;
	return value;
}

if (require.main === module)
	getIcs().then(console.log, console.error);

module.exports = { getIcs };
