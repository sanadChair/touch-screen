/// <reference types="vite/client" />
import * as ROSLIB from "roslib";
import { getRosConnectionHint, getRosUrl } from "./rosUrl";

export class RosService {
	private static instance: RosService | null = null;
	private ros: ROSLIB.Ros;
	private url: string = getRosUrl();
	private isConnected: boolean = false;

	private constructor() {
		console.info(`RosService: connecting to ${this.url}`);

		this.ros = new ROSLIB.Ros({
			url: this.url,
		});

		this.ros.on("connection", () => {
			console.log("RosService: connected to websocket");
			this.isConnected = true;
		});

		this.ros.on("error", (error) => {
			console.error("RosService: websocket error", error);
			console.error(getRosConnectionHint(this.url));
			this.isConnected = false;
		});

		this.ros.on("close", () => {
			console.warn("RosService: connection closed");
			console.warn(getRosConnectionHint(this.url));
			this.isConnected = false;

			setTimeout(() => {
				console.info("RosService: attempting reconnect");
				this.ros.connect(this.url);
			}, 5000);
		});
	}

	public static getInstance(): RosService {
		if (!this.instance) {
			this.instance = new RosService();
		}
		return this.instance;
	}

	public getRos(): ROSLIB.Ros {
		return this.ros;
	}

	public getUrl(): string {
		return this.url;
	}

	public get IsConnected(): boolean {
		return this.isConnected;
	}
}
