let dashboardData = {
  config: {},
  printers: [],
  materials: [],
  orders: [],
  stockMovements: [],
  quotes: []
};

let currentCalc = createEmptyCalc();
let editingOrderCode = null;
let currentInvoiceOrderCode = null;
let reportsVisibleCount = 100;
let pipelineVisibleCount = 100;
const LIST_PAGE_SIZE = 100;

const DEFAULT_CONFIG = {
  farmName: '3D Print Farm App',
  currencyName: 'جنيه',
  defaultProfitMargin: 100,
  defaultManualMinutes: 15,
  laborRate: 50,
  electricityCostPerHour: 3,
  packagingCost: 10,
  failurePercent: 10,
  defaultWasteWeight: 0,
  minimumOrderPrice: 0,
  accessoriesCost: 0,
  shippingCost: 0,
  defaultTaxPercent: 0,
  defaultDiscountValue: 0,
  roundingStep: 5
};


const MAIN_PANEL_IDS = [
  'reportsModal',
  'materialsManagerModal',
  'printersManagerModal',
  'customersModal',
  'pipelineModal',
  'settingsModal',
  'quotesModal'
];

const MODAL_IDS = [
  'reportsModal',
  'editModal',
  'invoiceModal',
  'materialsManagerModal',
  'printersManagerModal',
  'printerModal',
  'materialModal',
  'stockMovementsModal',
  'customersModal',
  'pipelineModal',
  'settingsModal',
  'quotesModal'
];

function createEmptyCalc() {
  return {
    quantity: 1,
    unitFinalPrice: 0,
    unitTotalCost: 0,
    unitProfit: 0,
    materialCost: 0,
    wasteWeight: 0,
    wasteCost: 0,
    depreciationCost: 0,
    electricityCost: 0,
    laborCost: 0,
    packagingCost: 0,
    accessoriesCost: 0,
    shippingCost: 0,
    riskCost: 0,
    taxCost: 0,
    totalCost: 0,
    priceBeforeDiscount: 0,
    discountValue: 0,
    priceAfterDiscount: 0,
    minimumOrderPrice: 0,
    roundedAdjustment: 0,
    finalPrice: 0,
    profit: 0,
    materialUsage: []
  };
}
