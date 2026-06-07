import { useState, useEffect } from "preact/hooks";
import { WheelchairServiceFactory } from "../services/WheelchairServiceFactory";

export function useWheelchair() {
	const service = WheelchairServiceFactory.getService();
	const [velocity, setVelocity] = useState({ linear: 0, angular: 0 });
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateVelocity = async (linear: number, angular: number) => {
		try {
			setError(null);
			const result = service.updateVelocity(linear, angular);
			if (result instanceof Promise) {
				await result;
			}
			setVelocity({ linear, angular });
		} catch (err: any) {
			setError(err.message || "Failed to update velocity");
			console.error(err);
		}
	};

	const refreshVelocity = async () => {
		setIsLoading(true);
		try {
			setError(null);
			const result = service.getVelocity();
			const vel = result instanceof Promise ? await result : result;
			setVelocity(vel);
		} catch (err: any) {
			setError(err.message || "Failed to fetch velocity");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void refreshVelocity();
	}, []);

	return {
		velocity,
		updateVelocity,
		refreshVelocity,
		isLoading,
		error,
	};
}
