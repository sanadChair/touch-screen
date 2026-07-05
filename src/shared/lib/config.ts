export const getServerUrl = (): string => {
	return localStorage.getItem("VITE_SERVER_URL") || import.meta.env.VITE_SERVER_URL || "http://localhost:5051/api/v1";
};

export const getConnectionType = (): string => {
	return localStorage.getItem("VITE_CONNECTION_TYPE") || import.meta.env.VITE_CONNECTION_TYPE || "NATIVE";
};
