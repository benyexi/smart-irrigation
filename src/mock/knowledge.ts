export interface PlantRecommendation {
  moistureRange: [number, number];
  startPotential: number;
  kc: number;
}

export const plantRecommendations: Record<string, PlantRecommendation> = {
  毛白杨: { moistureRange: [22, 34], startPotential: -60, kc: 0.9 },
  苹果: { moistureRange: [20, 32], startPotential: -55, kc: 0.88 },
  梨: { moistureRange: [20, 31], startPotential: -52, kc: 0.86 },
  桃: { moistureRange: [19, 30], startPotential: -50, kc: 0.82 },
  葡萄: { moistureRange: [18, 28], startPotential: -48, kc: 0.75 },
  玉米: { moistureRange: [24, 36], startPotential: -45, kc: 1.05 },
  小麦: { moistureRange: [21, 33], startPotential: -50, kc: 0.95 },
  棉花: { moistureRange: [17, 29], startPotential: -58, kc: 0.78 },
  其他: { moistureRange: [20, 30], startPotential: -50, kc: 0.85 },
};
