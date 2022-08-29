const { Client } = require('@notionhq/client');
const { databases, apiKey } = require('./creds.json');
const ics = require('ics');

const notion = new Client({ auth: apiKey });

const oneDay = 1000 * 60 * 60 * 24,
	sixMonths = oneDay * 30 * 6;

async function getEventList({ id, prop, filter }) {
	const dateFilter = {
		property: prop,
		date: {
			on_or_after: new Date(Date.now() - sixMonths).toISOString().substring(0, 10),
		}
	};
	const response = await notion.databases.query({
		database_id: id,
		filter: filter ? { and: [ filter, dateFilter ] } : dateFilter
	});
	console.log(JSON.stringify(response.results, null, 2))
	return response.results;
}

async function getPropertyById(pageId, property) {
	return await notion.pages.properties.retrieve({ page_id: pageId, property_id: property });
};

async function getProperty(page, propName) {
	return await getPropertyById(page.id, page.properties[propName].id);
};

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
			const title = (await getProperty(event, 'Name')).results[0]?.title.text.content ?? 'Unnamed event',
				date = (await getProperty(event, db.prop)).date;
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
