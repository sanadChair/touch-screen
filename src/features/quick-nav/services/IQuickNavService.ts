import type { QuickNavDestination } from "../types";

export interface IQuickNavService {
	getDestinations(): QuickNavDestination[];
	navigateTo(destination: QuickNavDestination): void;
}
