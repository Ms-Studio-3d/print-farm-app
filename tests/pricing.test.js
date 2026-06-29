const assert = require('node:assert/strict');
const { calculateMoo3dPricing, toPositiveInteger } = require('../js/pricing-core');

const sample = calculateMoo3dPricing({
  quantity: 1,
  materialCost: 8,
  wasteCost: 0,
  depreciationCost: 20,
  electricityCost: 0,
  laborCost: 0,
  packagingCost: 10,
  accessoriesCost: 20,
  shippingCost: 0,
  failurePercent: 10,
  taxPercent: 0,
  profitMargin: 100,
  discountValue: 0,
  minimumOrderPrice: 0,
  roundingStep: 5,
});

assert.equal(sample.productionSubtotal, 38);
assert.equal(Number(sample.riskCost.toFixed(2)), 3.8);
assert.equal(Number(sample.totalCost.toFixed(2)), 41.8);
assert.equal(Number(sample.priceBeforeDiscount.toFixed(2)), 103.6);
assert.equal(sample.finalPrice, 105);
assert.equal(Number(sample.profit.toFixed(2)), 43.2);
assert.equal(Number(sample.minimumNoLossPrice.toFixed(2)), 61.8);
assert.ok(sample.finalPrice >= sample.minimumNoLossPrice);

// 3 قطع في طبعة واحدة: الوقت والتغليف والخامات إجمالي للأوردر كله، وليس للقطعة.
// الإكسسوارات فقط لكل قطعة، والشحن مرة واحدة للأوردر.
const threePiecesSamePrint = calculateMoo3dPricing({
  quantity: 3,
  materialCost: 24,
  depreciationCost: 20,
  packagingCost: 10,
  accessoriesCost: 20,
  shippingCost: 15,
  failurePercent: 10,
  profitMargin: 100,
  roundingStep: 5,
});

assert.equal(threePiecesSamePrint.quantity, 3);
assert.equal(threePiecesSamePrint.materialCost, 24);
assert.equal(threePiecesSamePrint.depreciationCost, 20);
assert.equal(threePiecesSamePrint.packagingCost, 10);
assert.equal(threePiecesSamePrint.accessoriesCost, 60);
assert.equal(threePiecesSamePrint.shippingCost, 15);
assert.equal(Number(threePiecesSamePrint.productionSubtotal.toFixed(2)), 54);
assert.equal(Number(threePiecesSamePrint.riskCost.toFixed(2)), 5.4);
assert.equal(Number(threePiecesSamePrint.totalCost.toFixed(2)), 59.4);
assert.equal(threePiecesSamePrint.directAddOnsCost, 75);
assert.equal(Number(threePiecesSamePrint.priceBeforeDiscount.toFixed(2)), 193.8);
assert.equal(threePiecesSamePrint.finalPrice, 195);
assert.equal(Number(threePiecesSamePrint.profit.toFixed(2)), 60.6);
assert.equal(Number(threePiecesSamePrint.unitFinalPrice.toFixed(2)), 65);

const withShippingAndAccessories = calculateMoo3dPricing({
  quantity: 1,
  materialCost: 8,
  depreciationCost: 20,
  packagingCost: 10,
  accessoriesCost: 20,
  shippingCost: 15,
  failurePercent: 10,
  profitMargin: 100,
  roundingStep: 5,
});

assert.equal(Number(withShippingAndAccessories.totalCost.toFixed(2)), 41.8);
assert.equal(withShippingAndAccessories.directAddOnsCost, 35);
assert.equal(Number(withShippingAndAccessories.priceBeforeDiscount.toFixed(2)), 118.6);
assert.equal(withShippingAndAccessories.finalPrice, 120);
assert.equal(Number(withShippingAndAccessories.profit.toFixed(2)), 43.2);
assert.equal(Number(withShippingAndAccessories.minimumNoLossPrice.toFixed(2)), 76.8);

assert.equal(toPositiveInteger(3.8), 3);
assert.equal(toPositiveInteger('4'), 4);
assert.equal(toPositiveInteger(0), 1);

console.log('Pricing tests passed using js/pricing-core.js');
