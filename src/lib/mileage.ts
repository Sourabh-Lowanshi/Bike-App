/**
 * Core mileage math for BlackPearl.
 *
 * Formula (per spec):
 *   distanceTravelled = currentOdometer - previousFuelEntryOdometer
 *   mileage = distanceTravelled / litersFilled
 *
 * Example: previous fill at 1000 km, current fill at 1240 km, 6 liters filled
 *   distance = 240 km, mileage = 240 / 6 = 40 km/l
 */
export interface MileageResult {
  distanceSinceLastFill: number;
  mileage: number | null; // null when there's no previous entry to compare against
}

export function calculateMileage(
  currentOdometer: number,
  litersFilled: number,
  previousOdometer: number | null
): MileageResult {
  if (previousOdometer === null || previousOdometer === undefined) {
    return { distanceSinceLastFill: 0, mileage: null };
  }

  const distance = Math.max(0, currentOdometer - previousOdometer);

  if (litersFilled <= 0 || distance === 0) {
    return { distanceSinceLastFill: distance, mileage: null };
  }

  return {
    distanceSinceLastFill: distance,
    mileage: Number((distance / litersFilled).toFixed(2)),
  };
}

/**
 * Estimate fuel remaining in the tank using the most recent fill-up and
 * the bike's rolling average mileage.
 */
export function estimateFuelRemaining(params: {
  tankCapacity: number;
  lastFillLiters: number;
  lastFillOdometer: number;
  currentOdometer: number;
  averageMileage: number; // km/l
}): number {
  const { tankCapacity, lastFillLiters, lastFillOdometer, currentOdometer, averageMileage } =
    params;

  if (averageMileage <= 0) return tankCapacity;

  const distanceCovered = Math.max(0, currentOdometer - lastFillOdometer);
  const litersConsumed = distanceCovered / averageMileage;
  const remaining = Math.max(0, lastFillLiters - litersConsumed);

  return Number(Math.min(remaining, tankCapacity).toFixed(2));
}

export function costPerKm(totalCost: number, totalDistance: number): number {
  if (totalDistance <= 0) return 0;
  return Number((totalCost / totalDistance).toFixed(2));
}
