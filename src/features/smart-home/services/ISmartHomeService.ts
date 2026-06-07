import type { RoomAction } from "../../map/types";

export interface ISmartHomeService {
	executeAction(action: RoomAction, value?: boolean | number): Promise<void> | void;
}
