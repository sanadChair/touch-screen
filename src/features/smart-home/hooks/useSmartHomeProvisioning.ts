import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import { getServerUrl, getConnectionType } from "../../../shared/lib/config";
import { getServerHealth } from "../../../shared/hooks/useServerHealth";
import { RoomServiceFactory } from "../../map/services/RoomServiceFactory";
import { MockRoomService } from "../../map/services/MockRoomService";

export interface UnprovisionedDevice {
	id: string;
	macAddress: string;
	ssid: string;
	name: string;
}

export interface ProvisioningStatus {
	isScanning: boolean;
	isProcessing: boolean;
	queueSize: number;
	queuedSsids: string[];
	discoveredSsids: string[];
	homeWifiConfigured: boolean;
}

export function useSmartHomeProvisioning() {
	const serverUrl = getServerUrl();
	const [discoveredDevices, setDiscoveredDevices] = useState<UnprovisionedDevice[]>([]);
	const [isScanning, setIsScanning] = useState(false);
	const [isProvisioning, setIsProvisioning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [provisioningStatus, setProvisioningStatus] = useState<ProvisioningStatus>({
		isScanning: false,
		isProcessing: false,
		queueSize: 0,
		queuedSsids: [],
		discoveredSsids: [],
		homeWifiConfigured: false,
	});

	// Saved credentials in LocalStorage
	const [savedSsid, setSavedSsid] = useState("");
	const [savedPassword, setSavedPassword] = useState("");

	useEffect(() => {
		const storedSsid = localStorage.getItem("wifi_ssid") || "";
		const storedPassword = localStorage.getItem("wifi_password") || "";
		setSavedSsid(storedSsid);
		setSavedPassword(storedPassword);
	}, []);

	// Poll status ref and timer
	const pollIntervalRef = useRef<any>(null);

	const stopPolling = useCallback(() => {
		if (pollIntervalRef.current) {
			clearInterval(pollIntervalRef.current);
			pollIntervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => stopPolling();
	}, [stopPolling]);

	const fetchStatus = useCallback(async (): Promise<ProvisioningStatus | null> => {
		const connType = getConnectionType();
		const isOffline = connType === "MOCK" || getServerHealth() === "offline";

		if (isOffline) {
			return null;
		}

		try {
			const res = await fetch(`${serverUrl}/smart-home/provisioning/status`);
			if (!res.ok) throw new Error("Failed to fetch provisioning status");
			const statusObj = await res.json();
			const statusData = statusObj.data;
			setProvisioningStatus(statusData);
			return statusData;
		} catch (err: any) {
			console.error("Error fetching provisioning status:", err);
			return null;
		}
	}, [serverUrl]);

	// Scan for unprovisioned devices
	const scanUnprovisioned = useCallback(async () => {
		setIsScanning(true);
		setError(null);
		const connType = getConnectionType();
		const isOffline = connType === "MOCK" || getServerHealth() === "offline";

		if (isOffline) {
			// Simulate offline scan delay
			await new Promise((resolve) => setTimeout(resolve, 1500));
			setDiscoveredDevices([
				{
					id: "MOCK01",
					macAddress: "MOCK01",
					ssid: "smarthome_MOCK01",
					name: "smarthome_MOCK01",
				},
			]);
			setIsScanning(false);
			return;
		}

		try {
			const res = await fetch(`${serverUrl}/smart-home/provisioning/discover`);
			if (!res.ok) {
				const errResult = await res.json().catch(() => ({}));
				throw new Error(errResult.error?.message || "Failed to scan for new devices");
			}
			const resObj = await res.json();
			setDiscoveredDevices(resObj.data || []);
		} catch (err: any) {
			console.error(err);
			setError(err.message || "Failed to scan for new devices");
		} finally {
			setIsScanning(false);
		}
	}, [serverUrl]);

	// Register / Provision a device
	const provisionDevice = useCallback(
		async (
			macAddress: string,
			deviceName: string,
			roomId: string | undefined,
			ssid: string,
			password: string,
			saveCredentials = false,
			controlType = "binary:lighting"
		) => {
			setIsProvisioning(true);
			setError(null);

			if (saveCredentials) {
				localStorage.setItem("wifi_ssid", ssid);
				localStorage.setItem("wifi_password", password);
				setSavedSsid(ssid);
				setSavedPassword(password);
			} else {
				localStorage.removeItem("wifi_ssid");
				localStorage.removeItem("wifi_password");
				setSavedSsid("");
				setSavedPassword("");
			}

			const connType = getConnectionType();
			const isOffline = connType === "MOCK" || getServerHealth() === "offline";

			if (isOffline) {
				// Mock provisioning sequence
				try {
					// 1. Wifi credentials setup simulation
					await new Promise((resolve) => setTimeout(resolve, 800));
					setProvisioningStatus((prev) => ({ ...prev, homeWifiConfigured: true }));

					// 2. Enqueue device simulation
					const targetSsid = `smarthome_${macAddress}`;
					setProvisioningStatus((prev) => ({
						...prev,
						isProcessing: true,
						queueSize: 1,
						queuedSsids: [targetSsid],
					}));

					// 3. Background connection simulation
					await new Promise((resolve) => setTimeout(resolve, 2000));
					setProvisioningStatus((prev) => ({
						...prev,
						isProcessing: true,
						queueSize: 0,
						queuedSsids: [targetSsid],
					}));

					await new Promise((resolve) => setTimeout(resolve, 1000));

					const [mockType, mockCategory] = controlType.split(":");
					// DB registration in MockRoomService
					MockRoomService.getInstance().addDevice(roomId || "unassigned", {
						id: macAddress,
						name: deviceName,
						type: mockType || "binary",
						category: mockCategory || "",
					});

					// Reset state
					setProvisioningStatus((prev) => ({
						...prev,
						isProcessing: false,
						queueSize: 0,
						queuedSsids: [],
					}));

					setDiscoveredDevices((prev) => prev.filter((d) => d.macAddress !== macAddress));
					await RoomServiceFactory.getService().refreshRooms(true);
				} catch (err: any) {
					setError("Mock provisioning failed.");
				} finally {
					setIsProvisioning(false);
				}
				return;
			}

			// Real backend flow
			try {
				// 1. Send Wi-Fi credentials to server
				const wifiRes = await fetch(`${serverUrl}/smart-home/provisioning/wifi`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ssid, password }),
				});
				if (!wifiRes.ok) {
					const errResult = await wifiRes.json().catch(() => ({}));
					throw new Error(errResult.error?.message || "Failed to save Wi-Fi configuration on server");
				}

				// 2. Enqueue targeting device
				const targetRes = await fetch(`${serverUrl}/smart-home/provisioning/target`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ macAddress, deviceName, roomId, controlType }),
				});
				if (!targetRes.ok) {
					const errResult = await targetRes.json().catch(() => ({}));
					throw new Error(errResult.error?.message || "Failed to enqueue device for provisioning");
				}

				// 3. Start polling status
				stopPolling();
				const targetSsid = `smarthome_${macAddress}`;

				return new Promise<void>((resolve, reject) => {
					let pollCount = 0;
					pollIntervalRef.current = setInterval(async () => {
						pollCount++;
						const status = await fetchStatus();
						if (!status) {
							// If status fetch fails repeatedly
							if (pollCount > 15) {
								stopPolling();
								setIsProvisioning(false);
								reject(new Error("Provisioning status polling timed out. Check device connection."));
							}
							return;
						}

						// Check if completed:
						// Finished when: not processing anymore AND SSID is not in queue
						const isStillInQueue = status.queuedSsids.includes(targetSsid);
						if (!status.isProcessing && !isStillInQueue) {
							stopPolling();
							setIsProvisioning(false);
							// Remove from discovered list
							setDiscoveredDevices((prev) => prev.filter((d) => d.macAddress !== macAddress));
							// Refresh rooms to load the newly registered device
							RoomServiceFactory.getService().refreshRooms(true)
								.then(() => resolve())
								.catch((e) => {
									console.error("Failed to refresh rooms", e);
									resolve(); // Still succeed since device is provisioned
								});
						}
					}, 1000);
				});

			} catch (err: any) {
				console.error(err);
				setError(err.message || "Failed to provision device");
				setIsProvisioning(false);
			}
		},
		[serverUrl, fetchStatus, stopPolling]
	);

	return {
		discoveredDevices,
		isScanning,
		isProvisioning,
		provisioningStatus,
		error,
		savedSsid,
		savedPassword,
		scanUnprovisioned,
		provisionDevice,
		fetchStatus,
	};
}
