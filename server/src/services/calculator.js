// ==========================================================================
// HamTab — Solar sizing calculator
// ==========================================================================
import { HttpError } from "../router.js";

const PANEL_WATTAGE = 450;
const AVG_PEAK_SUN_HOURS = 4.2;
const PANEL_AREA_M2 = 2.1;
const PRICE_PER_TOMAN_KWH_ESTIMATE = 4200;

export function calculateSolarSystem(input) {
  const monthlyBillToman = Number(input.monthlyBill) || 0;
  const roofArea = Number(input.roofArea) || 0;
  const independence = Number(input.independence) || 80;

  if (monthlyBillToman < 0) throw new HttpError(400, "monthlyBill cannot be negative");
  if (roofArea < 0) throw new HttpError(400, "roofArea cannot be negative");

  const monthlyUsageKwh =
    Number(input.monthlyUsage) > 0
      ? Number(input.monthlyUsage)
      : Math.round(monthlyBillToman / PRICE_PER_TOMAN_KWH_ESTIMATE);

  const effectiveRoofArea = roofArea > 0 ? roofArea : 40;
  const targetCoverage = Math.min(Math.max(independence, 1), 100) / 100;

  const dailyConsumptionKwh = +(monthlyUsageKwh / 30).toFixed(1);
  const recommendedCapacityKw = +((dailyConsumptionKwh * targetCoverage) / AVG_PEAK_SUN_HOURS).toFixed(1);

  const estimatedPanelsByDemand = Math.max(3, Math.round((recommendedCapacityKw * 1000) / PANEL_WATTAGE));
  const maxPanelsByRoof = Math.max(3, Math.floor(effectiveRoofArea / PANEL_AREA_M2));
  const finalPanels = Math.min(estimatedPanelsByDemand, maxPanelsByRoof);
  const roofConstrained = estimatedPanelsByDemand > maxPanelsByRoof;

  const finalCapacityKw = +((finalPanels * PANEL_WATTAGE) / 1000).toFixed(1);
  const monthlyProductionKwh = Math.round(finalCapacityKw * AVG_PEAK_SUN_HOURS * 30);
  const coveragePercent = Math.min(100, Math.round((monthlyProductionKwh / (monthlyUsageKwh || 1)) * 100));

  const batteryRecommendationKwh =
    finalCapacityKw <= 3 ? 0 : finalCapacityKw <= 6 ? 5 : finalCapacityKw <= 10 ? 10 : 15;

  const suggestedPackageId =
    finalCapacityKw <= 3
      ? "pkg-starter"
      : finalCapacityKw <= 6
      ? "pkg-home"
      : finalCapacityKw <= 9
      ? "pkg-plus"
      : finalCapacityKw <= 14
      ? "pkg-advanced"
      : "pkg-commercial";

  return {
    dailyConsumptionKwh,
    monthlyConsumptionKwh: monthlyUsageKwh,
    recommendedCapacityKw: finalCapacityKw,
    estimatedPanels: finalPanels,
    monthlyProductionKwh,
    coveragePercent,
    batteryRecommendationKwh,
    suggestedPackageId,
    roofConstrained,
    assumptions: {
      panelWattage: PANEL_WATTAGE,
      avgPeakSunHours: AVG_PEAK_SUN_HOURS,
      panelAreaM2: PANEL_AREA_M2,
    },
  };
}
