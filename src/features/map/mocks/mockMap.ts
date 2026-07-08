import type { OccupancyGrid } from "../types";

// دالة لتوليد خريطة حقيقية للشقة للمحاكاة (بدل العشوائية)
const generateLargeMap = (width: number, height: number): OccupancyGrid => {
	const totalPixels = width * height;
	// تهيئة جميع البكسلات خارج الشقة بـ 1- (مجهول / رمادي)
	const data = new Array(totalPixels).fill(-1);

	// دوال مساعدة للرسم
	const setPixel = (x: number, y: number, val: number) => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			data[y * width + x] = val;
		}
	};

	const drawLine = (x1: number, y1: number, x2: number, y2: number, val: number) => {
		const minX = Math.min(x1, x2);
		const maxX = Math.max(x1, x2);
		const minY = Math.min(y1, y2);
		const maxY = Math.max(y1, y2);
		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				setPixel(x, y, val);
			}
		}
	};

	const drawRect = (x1: number, y1: number, x2: number, y2: number, val: number, fill = false) => {
		if (fill) {
			drawLine(x1, y1, x2, y2, val);
		} else {
			drawLine(x1, y1, x2, y1, val);
			drawLine(x1, y2, x2, y2, val);
			drawLine(x1, y1, x1, y2, val);
			drawLine(x2, y1, x2, y2, val);
		}
	};

	// 1. جعل داخل الشقة مساحة فارغة (0)
	const aptMinX = 150;
	const aptMaxX = 650;
	const aptMinY = 150;
	const aptMaxY = 650;
	drawRect(aptMinX, aptMinY, aptMaxX, aptMaxY, 0, true);

	// 2. رسم الجدران الخارجية للمبنى
	drawRect(aptMinX, aptMinY, aptMaxX, aptMaxY, 100, false);

	// 3. رسم جدران الممر الأوسط (الطرقة)
	const corrMinY = 370;
	const corrMaxY = 430;
	drawLine(aptMinX, corrMinY, aptMaxX, corrMinY, 100);
	drawLine(aptMinX, corrMaxY, aptMaxX, corrMaxY, 100);

	// 4. رسم الجدران الرأسية التي تقسم الغرف
	const divX1 = 300;
	const divX2 = 500;
	// جدران الغرف العلوية
	drawLine(divX1, aptMinY, divX1, corrMinY, 100);
	drawLine(divX2, aptMinY, divX2, corrMinY, 100);
	// جدران الغرف السفلية
	drawLine(divX1, corrMaxY, divX1, aptMaxY, 100);
	drawLine(divX2, corrMaxY, divX2, aptMaxY, 100);

	// 5. فتح أبواب الغرف (تفريغ الجدران بـ 0)
	// الأبواب بعرض 30 بكسل (حوالي 1.5 متر)
	const clearDoorwayH = (startX: number, rowY: number) => {
		drawLine(startX, rowY, startX + 30, rowY, 0);
	};
	// أبواب الغرف العلوية
	clearDoorwayH(210, corrMinY);
	clearDoorwayH(385, corrMinY);
	clearDoorwayH(560, corrMinY);
	// أبواب الغرف السفلية
	clearDoorwayH(210, corrMaxY);
	clearDoorwayH(385, corrMaxY);
	clearDoorwayH(560, corrMaxY);

	// 6. إضافة تفاصيل وأثاث كعقبات داخل الغرف لتبدو خريطة واقعية
	// الصالون (أعلى اليسار): كنبة على شكل L وطاولة قهوة
	drawLine(170, 180, 240, 200, 100);
	drawLine(170, 200, 190, 250, 100);
	drawRect(210, 220, 240, 240, 100, true); // طاولة

	// المطبخ (أعلى المنتصف): طاولة طعام وحوض رخام
	drawLine(300, 170, 350, 170, 100);
	drawLine(300, 170, 300, 230, 100);
	drawRect(370, 240, 430, 290, 100, true); // طاولة الطعام

	// المكتب (أعلى اليمين): مكتب وكرسي
	drawRect(580, 170, 630, 220, 100, true);

	// غرفة النوم (أسفل اليسار): سرير ودولاب
	drawRect(170, 560, 220, 620, 100, true); // سرير
	drawRect(260, 470, 295, 530, 100, true); // دولاب

	// غرف الحمام والغسيل (أسفل المنتصف واليمين): أجهزة وعقبات
	drawRect(370, 560, 420, 600, 100, true);
	drawRect(580, 560, 620, 600, 100, true);

	// ممر الطرقة: زرع زينة في المنتصف
	drawRect(320, 395, 335, 405, 100, true);

	// 7. إضافة ضوضاء خفيفة للجدران لتشبه مسح الليدار الحقيقي (Lidar noise)
	for (let i = 0; i < totalPixels; i++) {
		const row = Math.floor(i / width);
		const col = i % width;
		if (data[i] === 100) {
			// تضخيم عشوائي بسيط للجدران بنسبة 10%
			if (Math.random() < 0.1) {
				const nx = col + (Math.random() < 0.5 ? -1 : 1);
				const ny = row + (Math.random() < 0.5 ? -1 : 1);
				// تجنب سد الفتحات الخاصة بالأبواب
				const isNearDoorway = 
					(Math.abs(ny - corrMinY) <= 2 || Math.abs(ny - corrMaxY) <= 2) &&
					((nx >= 205 && nx <= 245) || (nx >= 380 && nx <= 420) || (nx >= 555 && nx <= 595));
				if (!isNearDoorway) {
					setPixel(nx, ny, 100);
				}
			}
		} else if (data[i] === 0) {
			// ضوضاء بكسلات فردية في المساحات الفارغة بنسبة ضئيلة جداً
			if (Math.random() < 0.0005) {
				data[i] = 100;
			}
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
				position: { x: -10.0, y: -10.0, z: 0.0 }, // نقطة الصفر
				orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
			},
		},
		data: data,
	};
};

export const MOCK_OCCUPANCY_GRID = generateLargeMap(800, 800);
