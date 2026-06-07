export interface IWheelchairService {
	updateVelocity(linear: number, angular: number): Promise<void> | void;
	getVelocity(): Promise<{ linear: number; angular: number }> | { linear: number; angular: number };
}
