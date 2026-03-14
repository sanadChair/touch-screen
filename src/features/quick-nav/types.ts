export interface NavigationPoint {
	x: number;
	y: number;
	z: number;
}

export interface QuickNavDestination {
	id: string;
	label: string;
	point: NavigationPoint;
}
