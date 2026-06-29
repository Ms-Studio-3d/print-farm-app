(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MOO3DPricing = api;
  root.roundUpByStep = api.roundUpByStep;
  root.calculateMoo3dPricing = api.calculateMoo3dPricing;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function roundUpByStep(value, step) {
    const safeValue = toNumber(value, 0);
    const safeStep = toNumber(step, 5);
    if (!Number.isFinite(safeStep) || safeStep <= 0) return safeValue;
    return Math.ceil(safeValue / safeStep) * safeStep;
  }

  function toPositiveInteger(value, fallback = 1) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const integer = Math.floor(n);
    return integer > 0 ? integer : fallback;
  }

  function calculateMoo3dPricing(input = {}) {
    const quantity = toPositiveInteger(input.quantity, 1);

    const unitMaterialCost = toNumber(input.materialCost, 0);
    const unitWasteCost = toNumber(input.wasteCost, 0);
    const unitDepreciationCost = toNumber(input.depreciationCost, 0);
    const unitElectricityCost = toNumber(input.electricityCost, 0);
    const unitLaborCost = toNumber(input.laborCost, 0);
    const unitPackagingCost = toNumber(input.packagingCost, 0);
    const unitAccessoriesCost = toNumber(input.accessoriesCost, 0);
    const unitShippingCost = toNumber(input.shippingCost, 0);

    const materialCost = unitMaterialCost * quantity;
    const wasteCost = unitWasteCost * quantity;
    const depreciationCost = unitDepreciationCost * quantity;
    const electricityCost = unitElectricityCost * quantity;
    const laborCost = unitLaborCost * quantity;
    const packagingCost = unitPackagingCost * quantity;
    // الإكسسوارات تكلفة على كل قطعة، أما الشحن فيضاف مرة واحدة على الأوردر كله.
    const accessoriesCost = unitAccessoriesCost * quantity;
    const shippingCost = unitShippingCost;

    const failurePercent = toNumber(input.failurePercent, 0);
    const taxPercent = toNumber(input.taxPercent, 0);
    const profitMargin = toNumber(input.profitMargin, 0);
    const discountValue = toNumber(input.discountValue, 0);
    const minimumOrderPrice = toNumber(input.minimumOrderPrice, 0);
    const roundingStep = toNumber(input.roundingStep, 5);

    const productionSubtotal = materialCost + wasteCost + depreciationCost + electricityCost + laborCost + packagingCost;
    const riskCost = productionSubtotal * (failurePercent / 100);
    const productionCostAfterRisk = productionSubtotal + riskCost;
    const taxCost = productionCostAfterRisk * (taxPercent / 100);
    const totalCost = productionCostAfterRisk + taxCost;
    const directAddOnsCost = accessoriesCost + shippingCost;

    const sellBeforeAddOns = totalCost * (1 + profitMargin / 100);
    const priceBeforeDiscount = sellBeforeAddOns + directAddOnsCost;
    const safeDiscountValue = Math.min(Math.max(discountValue, 0), priceBeforeDiscount);
    const priceAfterDiscountBeforeMinimum = Math.max(0, priceBeforeDiscount - safeDiscountValue);
    const priceAfterDiscount = Math.max(priceAfterDiscountBeforeMinimum, minimumOrderPrice);
    const finalPrice = roundUpByStep(priceAfterDiscount, roundingStep);
    const roundedAdjustment = finalPrice - priceAfterDiscount;

    const profit = finalPrice - totalCost - directAddOnsCost;
    const minimumNoLossPrice = totalCost + directAddOnsCost;

    return {
      quantity,
      unitMaterialCost,
      unitWasteCost,
      unitDepreciationCost,
      unitElectricityCost,
      unitLaborCost,
      unitPackagingCost,
      unitAccessoriesCost,
      unitShippingCost,
      materialCost,
      wasteCost,
      depreciationCost,
      electricityCost,
      laborCost,
      packagingCost,
      accessoriesCost,
      shippingCost,
      productionSubtotal,
      riskCost,
      productionCostAfterRisk,
      taxCost,
      totalCost,
      directAddOnsCost,
      sellBeforeAddOns,
      priceBeforeDiscount,
      safeDiscountValue,
      priceAfterDiscountBeforeMinimum,
      priceAfterDiscount,
      minimumOrderPrice,
      finalPrice,
      roundedAdjustment,
      profit,
      minimumNoLossPrice,
      unitFinalPrice: finalPrice / quantity,
      unitTotalCost: totalCost / quantity,
      unitProfit: profit / quantity,
    };
  }

  return { roundUpByStep, toPositiveInteger, calculateMoo3dPricing };
});
