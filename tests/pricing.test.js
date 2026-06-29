const assert = require('node:assert/strict');
const { calculateMoo3dPricing, toPositiveInteger } = require('../js/pricing-core');

const sample = calculateMoo3dPricing({
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

const multiPiece = calculateMoo3dPricing({
  quantity: 3,
  materialCost: 8,
  depreciationCost: 20,
  packagingCost: 10,
  accessoriesCost: 20,
  shippingCost: 0,
  failurePercent: 10,
  profitMargin: 100,
  roundingStep: 5,
});

assert.equal(multiPiece.quantity, 3);
assert.equal(Number(multiPiece.totalCost.toFixed(2)), 125.4);
assert.equal(multiPiece.directAddOnsCost, 60);
assert.equal(Number(multiPiece.priceBeforeDiscount.toFixed(2)), 310.8);
assert.equal(multiPiece.finalPrice, 315);
assert.equal(Number(multiPiece.profit.toFixed(2)), 129.6);
assert.equal(Number(multiPiece.unitFinalPrice.toFixed(2)), 105);

const withShippingAndAccessories = calculateMoo3dPricing({
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

const multiPieceWithOneShipping = calculateMoo3dPricing({
  quantity: 3,
  materialCost: 8,
  depreciationCost: 20,
  packagingCost: 10,
  accessoriesCost: 20,
  shippingCost: 15,
  failurePercent: 10,
  profitMargin: 100,
  roundingStep: 5,
});

assert.equal(multiPieceWithOneShipping.accessoriesCost, 60);
assert.equal(multiPieceWithOneShipping.shippingCost, 15);
assert.equal(multiPieceWithOneShipping.directAddOnsCost, 75);
assert.equal(Number(multiPieceWithOneShipping.priceBeforeDiscount.toFixed(2)), 325.8);
assert.equal(multiPieceWithOneShipping.finalPrice, 330);
assert.equal(Number(multiPieceWithOneShipping.profit.toFixed(2)), 129.6);

assert.equal(toPositiveInteger(3.8), 3);
assert.equal(toPositiveInteger('4'), 4);
assert.equal(toPositiveInteger(0), 1);

console.log('Pricing tests passed using js/pricing-core.js');
