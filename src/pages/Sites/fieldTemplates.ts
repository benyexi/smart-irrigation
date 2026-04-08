export type PlantLayoutSettings = {
  showPlants: boolean;
  rowSpacing: number;
  plantSpacing: number;
  orientation: 'horizontal' | 'vertical';
};

type PlantSpacingPreset = {
  rowSpacing: number;
  plantSpacing: number;
};

type PlantPosition = {
  id: string;
  x: number;
  y: number;
};

type GeneratePlantPositionsParams = {
  areaMu: number;
  rowSpacing: number;
  plantSpacing: number;
  orientation: 'horizontal' | 'vertical';
};

const FIELD_RATIO = 1.6;
const EDGE_MARGIN = 6;
const MIN_POINTS = 12;
const MAX_POINTS = 180;

const WOODY_PLANTS = new Set(['毛白杨', '苹果', '梨', '桃', '葡萄']);

export const plantSpacingDefaults: Record<string, PlantSpacingPreset> = {
  毛白杨: { rowSpacing: 6, plantSpacing: 5 },
  苹果: { rowSpacing: 4.5, plantSpacing: 3.5 },
  梨: { rowSpacing: 4.5, plantSpacing: 3.5 },
  桃: { rowSpacing: 4, plantSpacing: 3 },
  葡萄: { rowSpacing: 3.2, plantSpacing: 2.2 },
  玉米: { rowSpacing: 0.6, plantSpacing: 0.28 },
  小麦: { rowSpacing: 0.25, plantSpacing: 0.08 },
  棉花: { rowSpacing: 0.7, plantSpacing: 0.3 },
  其他: { rowSpacing: 3, plantSpacing: 2 },
};

const normalizePlantType = (plantType: string): string => {
  const trimmed = plantType.trim();
  return trimmed.length > 0 && trimmed in plantSpacingDefaults ? trimmed : '其他';
};

export const isWoodyPlant = (plantType: string): boolean => WOODY_PLANTS.has(plantType.trim());

export const getDefaultPlantLayout = (plantType: string): PlantLayoutSettings => {
  const presetKey = normalizePlantType(plantType);
  const preset = plantSpacingDefaults[presetKey];

  // 木本作物默认横向排布，便于在站点编辑器里沿地块长边布置行列。
  const orientation: 'horizontal' | 'vertical' = isWoodyPlant(presetKey) ? 'horizontal' : 'vertical';

  return {
    showPlants: true,
    rowSpacing: preset.rowSpacing,
    plantSpacing: preset.plantSpacing,
    orientation,
  };
};

const getFieldDimensions = (areaM2: number) => {
  const safeArea = Math.max(areaM2, 0);
  if (safeArea === 0) {
    return { lengthM: 0, widthM: 0 };
  }

  // 按 1.6:1 的长宽比还原为矩形地块，再用其边长推算排布数量。
  const lengthM = Math.sqrt(safeArea * FIELD_RATIO);
  const widthM = safeArea / lengthM;
  return { lengthM, widthM };
};

const normalizeSpacing = (value: number, fallback: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return value;
};

const fitGridCounts = (rows: number, plantsPerRow: number): { rows: number; plantsPerRow: number } => {
  let nextRows = Math.max(1, Math.floor(rows));
  let nextPlantsPerRow = Math.max(1, Math.floor(plantsPerRow));
  let total = nextRows * nextPlantsPerRow;

  if (total < MIN_POINTS) {
    // 点数不足时整体放大，保证至少有 12 个点位可供编辑器预览。
    const scale = Math.ceil(Math.sqrt(MIN_POINTS / total));
    nextRows *= scale;
    nextPlantsPerRow *= scale;
    total = nextRows * nextPlantsPerRow;
  }

  if (total > MAX_POINTS) {
    // 点数过多时按比例压缩，再逐步裁剪到上限。
    const scale = Math.sqrt(MAX_POINTS / total);
    nextRows = Math.max(1, Math.floor(nextRows * scale));
    nextPlantsPerRow = Math.max(1, Math.floor(nextPlantsPerRow * scale));

    while (nextRows * nextPlantsPerRow > MAX_POINTS) {
      if (nextRows >= nextPlantsPerRow && nextRows > 1) {
        nextRows -= 1;
      } else if (nextPlantsPerRow > 1) {
        nextPlantsPerRow -= 1;
      } else {
        break;
      }
    }
  }

  return { rows: nextRows, plantsPerRow: nextPlantsPerRow };
};

const toGridCoordinate = (index: number, total: number): number => {
  if (total <= 1) {
    return 50;
  }

  const innerSpan = 100 - EDGE_MARGIN * 2;
  return EDGE_MARGIN + (index / (total - 1)) * innerSpan;
};

export const generatePlantPositions = (params: GeneratePlantPositionsParams): PlantPosition[] => {
  const areaM2 = Math.max(params.areaMu, 0) * 666.67;
  if (areaM2 <= 0) {
    return [];
  }

  const rowSpacing = normalizeSpacing(params.rowSpacing, 1);
  const plantSpacing = normalizeSpacing(params.plantSpacing, 1);
  const { lengthM, widthM } = getFieldDimensions(areaM2);

  const rowAxis = params.orientation === 'horizontal' ? widthM : lengthM;
  const plantAxis = params.orientation === 'horizontal' ? lengthM : widthM;

  const baseRows = Math.max(1, Math.floor(rowAxis / rowSpacing) + 1);
  const basePlantsPerRow = Math.max(1, Math.floor(plantAxis / plantSpacing) + 1);
  const { rows, plantsPerRow } = fitGridCounts(baseRows, basePlantsPerRow);

  const positions: PlantPosition[] = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    for (let plantIndex = 0; plantIndex < plantsPerRow; plantIndex += 1) {
      const xIndex = params.orientation === 'horizontal' ? plantIndex : rowIndex;
      const yIndex = params.orientation === 'horizontal' ? rowIndex : plantIndex;

      positions.push({
        id: `plant-${rowIndex + 1}-${plantIndex + 1}`,
        x: toGridCoordinate(xIndex, params.orientation === 'horizontal' ? plantsPerRow : rows),
        y: toGridCoordinate(yIndex, params.orientation === 'horizontal' ? rows : plantsPerRow),
      });
    }
  }

  return positions;
};
