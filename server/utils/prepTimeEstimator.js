'use strict';

/**
 * CampusBite — Smart Kitchen Preparation Time Estimation Engine
 * 
 * =========================================================================
 * CSE326 Academic Viva Documentation: Formula & Algorithmic Assumptions
 * =========================================================================
 * 
 * Formula:
 *   Estimated Prep Time (mins) =
 *       Base Item Time
 *     + Multi-Item Batch Overhead
 *     + Active Kitchen Workload Queue Factor
 * 
 * Where:
 * 1. Base Item Time:
 *    max(item.preparationTime for item in ordered_items)
 *    Reasoning: Kitchen stations prepare primary dishes concurrently; the longest
 *    individual dish sets the baseline floor time.
 * 
 * 2. Multi-Item Batch Overhead:
 *    min(max(0, totalQuantity - 1) * 1.5, 8)
 *    Reasoning: Additional portions add sequential plating, packing and grilling overhead
 *    at ~1.5 minutes per extra unit, capped at 8 minutes.
 * 
 * 3. Active Kitchen Workload Queue Factor:
 *    min(activeKitchenOrdersCount * 2.5, 25)
 *    Reasoning: Each pending order ahead in queue ('Placed' or 'Preparing') adds
 *    approximately 2.5 minutes of queuing delay, capped at 25 minutes to avoid unrealistic estimates.
 * 
 * 4. Boundary Clamping:
 *    Result is rounded and bounded between [5 mins, 45 mins].
 */

function calculateEstimatedPrepTime(items, activeKitchenOrdersCount = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return 10; // Default baseline fallback
  }

  // 1. Base Item Time (longest single dish)
  const itemPrepTimes = items.map(i => Number(i.preparationTime) || 10);
  const baseItemTime = Math.max(...itemPrepTimes);

  // 2. Multi-item batch overhead
  const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const extraItems = Math.max(0, totalQuantity - 1);
  const batchOverhead = Math.min(extraItems * 1.5, 8);

  // 3. Active kitchen queue factor
  const queueDelay = Math.min(Math.max(0, activeKitchenOrdersCount) * 2.5, 25);

  // Total raw minutes
  const rawEstimate = baseItemTime + batchOverhead + queueDelay;

  // Clamped between 5 and 45 minutes
  const finalMinutes = Math.min(45, Math.max(5, Math.round(rawEstimate)));

  return finalMinutes;
}

module.exports = {
  calculateEstimatedPrepTime
};
