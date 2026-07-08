import { useServerHealth } from "../hooks/useServerHealth";

export function OfflineBanner() {
	const { isOffline } = useServerHealth();

	if (!isOffline) return null;

	return <></>;
}
