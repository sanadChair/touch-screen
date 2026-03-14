import type { IQuickNavService } from "./IQuickNavService";
import { NativeQuickNavService } from "./NativeQuickNavService";

export class QuickNavServiceFactory {
	private static instance: IQuickNavService | null = null;

	static getService(): IQuickNavService {
		if (!this.instance) {
			this.instance = new NativeQuickNavService();
		}
		return this.instance;
	}
}
