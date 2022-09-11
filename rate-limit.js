class RateLimiter {
	constructor() {
		this.lastRun = Date.now();
	}

	reset() { this.nextDelay = 0; }
	step() { this.nextDelay = Math.min((this.nextDelay + 100) * 2, 3000); }
	unstep() { this.nextDelay = this.nextDelay * 0.75; }
	delay() { return new Promise(resolve => setTimeout(resolve, this.nextDelay)); }

	async run(callback) {
		if (this.waitingOn) await this.waitingOn.catch(e => { throw new Error('Previous job failed'); });
		else if (Date.now() - this.lastRun > 10000) this.reset();
		this.waitingOn = this._run(callback);
		const result = await this.waitingOn;
		this.lastRun = Date.now();
		return result;
	}

	async _run(callback) {
		let tries = 0;
		try {
			return await callback();
		} catch (e) {
			if (e.status === 429 && tries++ < 5) await this.delay();
			else throw e;
		}
	}
}

module.exports = RateLimiter;
