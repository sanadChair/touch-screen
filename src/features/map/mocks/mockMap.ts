import type { OccupancyGrid } from "../types";

// دالة لتوليد خريطة كبيرة وعشوائية للمحاكاة
const generateLargeMap = (width: number, height: number): OccupancyGrid => {
	const totalPixels = width * height;
	const data = new Array(totalPixels).fill(0); // املأها أصفار (فراغ)

	// إضافة جدران عشوائية وضوضاء
	for (let i = 0; i < totalPixels; i++) {
		const random = Math.random();
		if (random > 0.98) {
			data[i] = 100; // جدار (أسود)
		} else if (random > 0.9) {
			data[i] = -1; // مجهول (رمادي)
		} else {
			data[i] = 0; // فاضي (أبيض)
		}

		// رسم إطار حول الخريطة
		const row = Math.floor(i / width);
		const col = i % width;
		if (row === 0 || row === height - 1 || col === 0 || col === width - 1) {
			data[i] = 100;
		}
	}

	return {
		header: {
			frame_id: "map",
			stamp: { sec: 1620000000, nanosec: 0 },
		},
		info: {
			resolution: 0.05,
			width: width,
			height: height,
			origin: {
				position: { x: -10.0, y: -10.0, z: 0.0 }, // تغيير نقطة الصفر
				orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
			},
		},
		data: data,
	};
};

// توليد خريطة 800x800 (حوالي 640 ألف بيكسل)
// ده حجم متوسط لشقة
export const MOCK_OCCUPANCY_GRID = generateLargeMap(800, 800);
