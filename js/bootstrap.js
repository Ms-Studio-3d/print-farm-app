function bindLiveCalculationInputs() {
  [
    'printHours',
    'manualMins',
    'profitMargin',
    'discountValue',
    'selectedPrinter',
    'laborRate',
    'electricityCostPerHour',
    'packagingCost',
    'failurePercent',
    'wasteWeight',
    'minimumOrderPrice',
    'shippingCost',
    'defaultTaxPercent'
  ].forEach((id) => {
    const el = $(id);
    if (!el) return;

    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
}

function bindSettingsLiveInputs() {
  [
    'farmName',
    'currencyName',
    'settingsDefaultProfitMargin',
    'settingsDefaultManualMinutes',
    'settingsLaborRate',
    'settingsElectricityCostPerHour',
    'settingsPackagingCost',
    'settingsFailurePercent',
    'settingsDefaultWasteWeight',
    'settingsMinimumOrderPrice',
    'settingsShippingCost',
    'settingsDefaultTaxPercent',
    'settingsDefaultDiscountValue',
    'settingsRoundingStep'
  ].forEach((id) => {
    const el = $(id);
    if (!el) return;

    el.addEventListener('input', () => {
      if (id === 'farmName') {
        const appTitle = document.querySelector('.app-title');
        if (appTitle) appTitle.innerText = getTrimmedValue('farmName', DEFAULT_CONFIG.farmName);
      }
    });
  });
}

function bindGlobalKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllModals();
      setActiveNav('order');
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();

      if (isModalOpen('settingsModal')) {
        saveSettings();
      }
    }
  });
}

function bindImportInput() {
  const input = $('importBackupInput');
  if (input) {
    input.addEventListener('change', importBackupFromFile);
  }
}

function initializeDates() {
  const today = new Date().toISOString().slice(0, 10);

  if ($('opDate') && !getValue('opDate')) {
    setValue('opDate', today);
  }

  if ($('filterTo') && !getValue('filterTo')) {
    setValue('filterTo', today);
  }

  if ($('pipelineTo') && !getValue('pipelineTo')) {
    setValue('pipelineTo', today);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeDates();
  bindLiveCalculationInputs();
  bindSettingsLiveInputs();
  bindGlobalKeyboardShortcuts();
  bindImportInput();

  await loadDashboardData();
});
