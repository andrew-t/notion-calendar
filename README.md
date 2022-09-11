# notion-calendar

So I use [Notion](https://www.notion.so) as my main productivity tool (which if you know me is pretty damning toward Notion but I swear my chaotic life is not their fault) and my main gripe with it, aside from Google shutting down my IFTTT voice assistant integration, is that I can't access notes about events and trips from Google Calendar. I should be able to do that, right? Notion knows when the events are, it should be easy enough to export that as an ICS file and import it into calendar apps. But it's not a feature, at least not yet. So I built it.

# Usage

I assume for this that you have a Notion database you want to import into your calendar app. If you have more than one, that's not supported yet.

Clone this repo into a folder somewhere, then run `npm install` to install the dependencies. It should work on any recent version of Node. It's currently tested on v16 and v17.

Next, create a file called `creds.json`, which looks like this:

```json
{
	"apiKey": "xyz",
	"databases": [
		{
			"id": "xyz",
			"prop": "Date"
		},
		{
			"id": "xyz",
			"prop": "Due",
			"filter": { "and" : [
				{ "property": "Status", "status": { "does_not_equal": "Done" } },
				{ "property": "Status", "status": { "does_not_equal": "Rejected" } }
			] }
		}
	]
}

```

* The database IDs are the string of hex that identifies the page in Notion. It happens to be a UUID presented without hyphens but that's not important. Go to the main database page and it's the bit in the URL after `notion.so/[your_username]/` and before any `?` parameters.
* The API key you can get by creating an integration in the settings menu. Remember to share the database page with the integration using the 'share' menu on the database page.
* `prop` is the text name of the property that stores the date. It'll be something like "Date" or "When" or suchlike depending what you called it.
* `filter` is a standard [Notion Filter object](https://developers.notion.com/reference/post-database-query-filter#type-specific-filter-conditions).

Lastly, run `node index.js` to start the server. Any URL you hit will show the ICS file so point Google Calendar at literally any of them and it should work.

I run it on my main web server under an unguessable URL which seems like enough security given all you could do with it is know when I have events on. They're mostly public events anyway. If you need more then idk, feel free to add more, but if you're pulling it into a calendar app then somewhere along the line it's going to be an ungessable URL solution.

# Contributing

I made this just for myself so there's a bunch of stuff it can't do because I don't need it, such as proper security, handling the API rate limits, pulling in the page body or support multiple databases. Feel free to add it and make a pull request. There's no process. Just be sensible.
