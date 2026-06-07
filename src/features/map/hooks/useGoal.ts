import { MapServiceFactory } from "../services/MapServiceFactory";

const useGoal = () => {
	const handleGoalClick = (x: number, y: number, label?: string) => {
		MapServiceFactory.getService().setGoal(x, y, label);
	};

	return { handleGoalClick };
};

export default useGoal;
