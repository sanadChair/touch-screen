import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'

// Globally intercept all fetches to apply the ngrok skip browser warning header
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	if (typeof input === "string" || input instanceof URL) {
		const headers = new Headers(init?.headers);
		headers.set("ngrok-skip-browser-warning", "true");
		return originalFetch(input, {
			...init,
			headers,
		});
	} else {
		const newRequest = new Request(input, init);
		newRequest.headers.set("ngrok-skip-browser-warning", "true");
		return originalFetch(newRequest);
	}
};

render(<App />, document.getElementById('app')!)

