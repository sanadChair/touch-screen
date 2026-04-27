const DEFAULT_ROS_URL = "ws://172.18.224.22:9090";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const getRosUrl = (): string => {
	const rawUrl = (import.meta.env.VITE_ROS_URL || DEFAULT_ROS_URL).trim();
	const normalizedUrl = trimTrailingSlash(rawUrl);

	if (
		typeof window !== "undefined" &&
		window.location.protocol === "https:" &&
		normalizedUrl.startsWith("ws://")
	) {
		const secureUrl = normalizedUrl.replace(/^ws:\/\//, "wss://");
		console.warn(
			`ROS URL "${normalizedUrl}" is insecure for an HTTPS page. Using "${secureUrl}" instead.`,
		);
		return secureUrl;
	}

	return normalizedUrl;
};

export const getRosConnectionHint = (url: string): string => {
	const hints = [
		`ROS bridge URL: ${url}.`,
		"Verify rosbridge_server is listening on the tunneled port.",
		"Restart the Vite dev server after changing VITE_ROS_URL.",
	];

	if (url.includes("pinggy")) {
		hints.push(
			"Pinggy free links expire and rotate, so confirm this is the current active tunnel URL.",
		);
	}

	if (
		typeof window !== "undefined" &&
		window.location.protocol === "https:" &&
		url.startsWith("ws://")
	) {
		hints.push("Use wss:// when the app itself is served over HTTPS.");
	}

	return hints.join(" ");
};
