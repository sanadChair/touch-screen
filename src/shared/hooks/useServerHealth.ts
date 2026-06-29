import { useState, useEffect } from "preact/hooks";

export type HealthStatus = "connected" | "offline";

let globalStatus: HealthStatus = "connected";
const listeners = new Set<(status: HealthStatus) => void>();

export const setServerHealth = (status: HealthStatus) => {
	if (globalStatus === status) return;
	globalStatus = status;
	for (const listener of listeners) {
		listener(status);
	}
};

export const getServerHealth = () => globalStatus;

export const subscribeServerHealth = (listener: (status: HealthStatus) => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const useServerHealth = () => {
	const [status, setStatus] = useState<HealthStatus>(globalStatus);

	useEffect(() => {
		listeners.add(setStatus);
		return () => {
			listeners.delete(setStatus);
		};
	}, []);

	return {
		status,
		isOffline: status === "offline",
		setOffline: () => setServerHealth("offline"),
		setConnected: () => setServerHealth("connected"),
	};
};
