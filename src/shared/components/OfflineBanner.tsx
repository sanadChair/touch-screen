import { useServerHealth } from "../hooks/useServerHealth";
import { AlertTriangle, RefreshCw } from "lucide-preact";
import { useState } from "preact/hooks";

export function OfflineBanner() {
	const { isOffline, setConnected } = useServerHealth();
	const [isRetrying, setIsRetrying] = useState(false);

	if (!isOffline) return null;

	const handleRetry = async () => {
		setIsRetrying(true);
		// Simulate a brief retry delay
		await new Promise((resolve) => setTimeout(resolve, 800));
		setConnected();
		setIsRetrying(false);
	};

	return (
		<div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 backdrop-blur-sm z-50">
			<div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
				<AlertTriangle size={18} className="shrink-0 text-amber-500 animate-pulse" />
				<span>Kiosk offline — showing demo data</span>
			</div>
			<button
				onClick={handleRetry}
				disabled={isRetrying}
				className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:bg-amber-700 transition-colors text-xs sm:text-sm font-bold shadow-sm cursor-pointer disabled:opacity-50"
			>
				<RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
				{isRetrying ? "Retrying..." : "Retry Connection"}
			</button>
		</div>
	);
}
