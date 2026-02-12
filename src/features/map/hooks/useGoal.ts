import { MapServiceFactory } from "../services/MapServiceFactory";

const useGoal = () => {
	const handleGoalClick = (x: number, y: number) => {
		MapServiceFactory.getService().setGoal(x, y);
	};

	return { handleGoalClick };
};

export default useGoal;
