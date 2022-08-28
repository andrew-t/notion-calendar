const { Client } = require('@notionhq/client');
const { databaseId, apiKey, prop } = require('./creds.json');
const ics = require('ics');

const notion = new Client({ auth: apiKey });

const sixMonths = 1000 * 60 * 60 * 24 * 30 * 6;

async function getEventList() {
	const response = await notion.databases.query({
		database_id: databaseId,
		filter: {
			property: prop,
			date: {
				on_or_after: new Date(Date.now() - sixMonths).toISOString().substring(0, 10),
			}
		}
	});
	return response.results;
}

async function getEvent(pageId) {
	return await notion.pages.retrieve({ page_id: pageId });
}

async function getPropertyById(pageId, property) {
	return await notion.pages.properties.retrieve({ page_id: pageId, property_id: property });
};

async function getProperty(page, propName) {
	return await getPropertyById(page.id, page.properties[propName].id);
};

async function *getAllEvents() {
	const list = await getEventList();
	for (const event of list) {
		yield await getEvent(event.id);
	}
}

async function getIcsEvents() {
	const events = [];
	for await (const event of getAllEvents()) {
		const title = (await getProperty(event, 'Name')).results[0]?.title.text.content ?? 'Unnamed event',
			date = (await getProperty(event, prop)).date;
		events.push({
			productId: databaseId,
			uid: event.id,
			startOutputType: 'local',
			start: date.start.split('-').map(x => parseInt(x, 10)),
			end: (date.end ?? date.start).split('-').map(x => parseInt(x, 10)),
			title,
			alarms: [],
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

// (async () => {
// 	try {
// 		console.log(await getIcs());
// 	} catch (e) {
// 		console.error(e);
// 	}
// })();

module.exports = { getIcs };
