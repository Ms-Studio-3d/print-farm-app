const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db = null;

function getDatabasePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'print-farm.db');
}

function getDb() {
  if (db) return db;

  db = new Database(getDatabasePath());
  db.pragma('journal_mode = WAL');

  createTables();
  seedDefaults();

  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT DEFAULT '',
      status TEXT DEFAULT 'idle',
      hourly_depreciation REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT '',
      color TEXT DEFAULT '',
      weight REAL NOT NULL DEFAULT 1000,
      remaining REAL NOT NULL DEFAULT 1000,
      price REAL NOT NULL DEFAULT 0,
      low_stock_threshold REAL NOT NULL DEFAULT 150,
      supplier TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      item_name TEXT NOT NULL,
      customer_name TEXT DEFAULT '',
      printer_id INTEGER,
      order_status TEXT DEFAULT 'new',
      print_hours REAL NOT NULL DEFAULT 0,
      manual_minutes REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      order_date TEXT NOT NULL,
      material_cost REAL NOT NULL DEFAULT 0,
      depreciation_cost REAL NOT NULL DEFAULT 0,
      electricity_cost REAL NOT NULL DEFAULT 0,
      labor_cost REAL NOT NULL DEFAULT 0,
      packaging_cost REAL NOT NULL DEFAULT 0,
      shipping_cost REAL NOT NULL DEFAULT 0,
      risk_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      final_price REAL NOT NULL DEFAULT 0,
      profit REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (printer_id) REFERENCES printers(id)
    );

    CREATE TABLE IF NOT EXISTS order_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      grams REAL NOT NULL DEFAULT 0,
      price_per_gram REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      reason TEXT DEFAULT '',
      reference_code TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );
  `);
}

function seedDefaults() {
  const hasPrinters = db.prepare('SELECT COUNT(*) AS count FROM printers').get().count;
  const hasMaterials = db.prepare('SELECT COUNT(*) AS count FROM materials').get().count;

  if (hasPrinters === 0) {
    const insertPrinter = db.prepare(`
      INSERT INTO printers (name, model, status, hourly_depreciation, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertPrinter.run('Bambu Lab A1', 'A1', 'idle', 12, '');
    insertPrinter.run('Bambu Lab P1S', 'P1S', 'idle', 15, '');
  }

  if (hasMaterials === 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO materials (name, type, color, weight, remaining, price, low_stock_threshold, supplier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMaterial.run('PLA Black', 'PLA', 'Black', 1000, 1000, 800, 150, '');
    insertMaterial.run('PLA White', 'PLA', 'White', 1000, 1000, 800, 150, '');
    insertMaterial.run('PLA Red', 'PLA', 'Red', 1000, 1000, 800, 150, '');
    insertMaterial.run('PLA Silk Gold', 'PLA Silk', 'Gold', 1000, 1000, 1200, 150, '');
  }

  const defaults = {
    farmName: 'Print Farm App',
    currencyName: 'ج',
    laborRate: '50',
    electricityCostPerHour: '3',
    packagingCost: '10',
    failurePercent: '10',
    shippingCost: '0',
    defaultTaxPercent: '0'
  };

  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO app_config (key, value)
    VALUES (?, ?)
  `);

  Object.entries(defaults).forEach(([key, value]) => {
    insertConfig.run(key, String(value));
  });
}

function getAllConfig() {
  const rows = db.prepare('SELECT key, value FROM app_config').all();
  const config = {};

  for (const row of rows) {
    config[row.key] = row.value;
  }

  return config;
}

function setConfig(key, value) {
  db.prepare(`
    INSERT INTO app_config (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, String(value));
}

function getDashboardData() {
  const printers = db.prepare(`
    SELECT id, name, model, status, hourly_depreciation AS hourlyDepreciation, notes
    FROM printers
    ORDER BY id DESC
  `).all();

  const materials = db.prepare(`
    SELECT
      id,
      name,
      type,
      color,
      weight,
      remaining,
      price,
      low_stock_threshold AS lowStockThreshold,
      supplier
    FROM materials
    ORDER BY id DESC
  `).all();

  const orders = db.prepare(`
    SELECT
      o.id,
      o.code,
      o.item_name AS itemName,
      o.customer_name AS customerName,
      o.printer_id AS printerId,
      COALESCE(p.name, '') AS printerName,
      o.order_status AS status,
      o.print_hours AS printHours,
      o.manual_minutes AS manualMinutes,
      o.notes,
      o.order_date AS date,
      o.material_cost AS materialCost,
      o.depreciation_cost AS depreciationCost,
      o.electricity_cost AS electricityCost,
      o.labor_cost AS laborCost,
      o.packaging_cost AS packagingCost,
      o.shipping_cost AS shippingCost,
      o.risk_cost AS riskCost,
      o.total_cost AS totalCost,
      o.final_price AS finalPrice,
      o.profit
    FROM orders o
    LEFT JOIN printers p ON p.id = o.printer_id
    ORDER BY o.order_date DESC, o.id DESC
  `).all();

  const stockMovements = db.prepare(`
    SELECT
      id,
      material_id AS materialId,
      material_name AS materialName,
      movement_type AS movementType,
      quantity,
      reason,
      reference_code AS referenceCode,
      created_at AS createdAt
    FROM stock_movements
    ORDER BY id DESC
    LIMIT 300
  `).all();

  return {
    config: getAllConfig(),
    printers,
    materials,
    orders,
    stockMovements
  };
}

function createPrinter(data) {
  const stmt = db.prepare(`
    INSERT INTO printers (name, model, status, hourly_depreciation, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.name,
    data.model || '',
    data.status || 'idle',
    Number(data.hourlyDepreciation || 0),
    data.notes || ''
  );

  return result.lastInsertRowid;
}

function updatePrinter(data) {
  db.prepare(`
    UPDATE printers
    SET
      name = ?,
      model = ?,
      status = ?,
      hourly_depreciation = ?,
      notes = ?
    WHERE id = ?
  `).run(
    data.name,
    data.model || '',
    data.status || 'idle',
    Number(data.hourlyDepreciation || 0),
    data.notes || '',
    Number(data.id)
  );
}

function deletePrinter(id) {
  db.prepare('UPDATE orders SET printer_id = NULL WHERE printer_id = ?').run(Number(id));
  db.prepare('DELETE FROM printers WHERE id = ?').run(Number(id));
}

function createMaterial(data) {
  const stmt = db.prepare(`
    INSERT INTO materials (name, type, color, weight, remaining, price, low_stock_threshold, supplier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.name,
    data.type || '',
    data.color || '',
    Number(data.weight || 0),
    Number(data.remaining || 0),
    Number(data.price || 0),
    Number(data.lowStockThreshold || 0),
    data.supplier || ''
  );

  db.prepare(`
    INSERT INTO stock_movements (material_id, material_name, movement_type, quantity, reason, reference_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    result.lastInsertRowid,
    data.name,
    'in',
    Number(data.remaining || 0),
    'إضافة خامة جديدة',
    ''
  );

  return result.lastInsertRowid;
}

function updateMaterial(data) {
  const oldMaterial = db.prepare('SELECT * FROM materials WHERE id = ?').get(Number(data.id));
  if (!oldMaterial) return;

  db.prepare(`
    UPDATE materials
    SET
      name = ?,
      type = ?,
      color = ?,
      weight = ?,
      remaining = ?,
      price = ?,
      low_stock_threshold = ?,
      supplier = ?
    WHERE id = ?
  `).run(
    data.name,
    data.type || '',
    data.color || '',
    Number(data.weight || 0),
    Number(data.remaining || 0),
    Number(data.price || 0),
    Number(data.lowStockThreshold || 0),
    data.supplier || '',
    Number(data.id)
  );

  const difference = Number(data.remaining || 0) - Number(oldMaterial.remaining || 0);

  if (difference !== 0) {
    db.prepare(`
      INSERT INTO stock_movements (material_id, material_name, movement_type, quantity, reason, reference_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      Number(data.id),
      data.name,
      difference > 0 ? 'adjust_in' : 'adjust_out',
      Math.abs(difference),
      'تعديل يدوي على المخزون',
      ''
    );
  }
}

function deleteMaterial(id) {
  db.prepare('DELETE FROM stock_movements WHERE material_id = ?').run(Number(id));
  db.prepare('DELETE FROM materials WHERE id = ?').run(Number(id));
}

function getNextOrderCode() {
  const lastOrder = db.prepare(`
    SELECT code
    FROM orders
    ORDER BY id DESC
    LIMIT 1
  `).get();

  if (!lastOrder || !lastOrder.code) {
    return 'ORD-1001';
  }

  const match = String(lastOrder.code).match(/ORD-(\d+)/);
  if (!match) return 'ORD-1001';

  return `ORD-${Number(match[1]) + 1}`;
}

function createOrder(payload) {
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      code,
      item_name,
      customer_name,
      printer_id,
      order_status,
      print_hours,
      manual_minutes,
      notes,
      order_date,
      material_cost,
      depreciation_cost,
      electricity_cost,
      labor_cost,
      packaging_cost,
      shipping_cost,
      risk_cost,
      total_cost,
      final_price,
      profit
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMaterialUsage = db.prepare(`
    INSERT INTO order_materials (
      order_id,
      material_id,
      material_name,
      grams,
      price_per_gram,
      total_cost
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const updateMaterialStock = db.prepare(`
    UPDATE materials
    SET remaining = remaining - ?
    WHERE id = ? AND remaining >= ?
  `);

  const insertStockMovement = db.prepare(`
    INSERT INTO stock_movements (
      material_id,
      material_name,
      movement_type,
      quantity,
      reason,
      reference_code
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((data) => {
    for (const item of data.materialUsage) {
      const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(Number(item.materialId));

      if (!material) {
        throw new Error(`الخامة غير موجودة: ${item.materialName}`);
      }

      if (Number(material.remaining) < Number(item.grams)) {
        throw new Error(`المخزون غير كافٍ في: ${item.materialName}`);
      }
    }

    const orderResult = insertOrder.run(
      data.code,
      data.itemName,
      data.customerName || '',
      data.printerId ? Number(data.printerId) : null,
      data.status || 'new',
      Number(data.printHours || 0),
      Number(data.manualMinutes || 0),
      data.notes || '',
      data.date,
      Number(data.materialCost || 0),
      Number(data.depreciationCost || 0),
      Number(data.electricityCost || 0),
      Number(data.laborCost || 0),
      Number(data.packagingCost || 0),
      Number(data.shippingCost || 0),
      Number(data.riskCost || 0),
      Number(data.totalCost || 0),
      Number(data.finalPrice || 0),
      Number(data.profit || 0)
    );

    const orderId = orderResult.lastInsertRowid;

    for (const item of data.materialUsage) {
      updateMaterialStock.run(
        Number(item.grams),
        Number(item.materialId),
        Number(item.grams)
      );

      insertMaterialUsage.run(
        Number(orderId),
        Number(item.materialId),
        item.materialName,
        Number(item.grams),
        Number(item.pricePerGram || 0),
        Number(item.totalCost || 0)
      );

      insertStockMovement.run(
        Number(item.materialId),
        item.materialName,
        'out',
        Number(item.grams),
        'استهلاك في أوردر',
        data.code
      );
    }
  });

  transaction(payload);
}

function updateOrder(payload) {
  db.prepare(`
    UPDATE orders
    SET
      item_name = ?,
      customer_name = ?,
      printer_id = ?,
      order_status = ?,
      notes = ?,
      order_date = ?,
      total_cost = ?,
      final_price = ?,
      profit = ?
    WHERE code = ?
  `).run(
    payload.itemName,
    payload.customerName || '',
    payload.printerId ? Number(payload.printerId) : null,
    payload.status || 'new',
    payload.notes || '',
    payload.date,
    Number(payload.totalCost || 0),
    Number(payload.finalPrice || 0),
    Number(payload.profit || 0),
    payload.code
  );
}

function deleteOrder(code) {
  const order = db.prepare('SELECT id, code FROM orders WHERE code = ?').get(code);
  if (!order) return;

  const materials = db.prepare(`
    SELECT material_id AS materialId, material_name AS materialName, grams
    FROM order_materials
    WHERE order_id = ?
  `).all(order.id);

  const transaction = db.transaction(() => {
    for (const item of materials) {
      db.prepare(`
        UPDATE materials
        SET remaining = remaining + ?
        WHERE id = ?
      `).run(Number(item.grams), Number(item.materialId));

      db.prepare(`
        INSERT INTO stock_movements (
          material_id,
          material_name,
          movement_type,
          quantity,
          reason,
          reference_code
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        Number(item.materialId),
        item.materialName,
        'return',
        Number(item.grams),
        'استرجاع بعد حذف أوردر',
        order.code
      );
    }

    db.prepare('DELETE FROM order_materials WHERE order_id = ?').run(order.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(order.id);
  });

  transaction();
}

function replaceAllData(data) {
  const transaction = db.transaction((payload) => {
    db.exec(`
      DELETE FROM order_materials;
      DELETE FROM stock_movements;
      DELETE FROM orders;
      DELETE FROM materials;
      DELETE FROM printers;
      DELETE FROM app_config;
    `);

    const insertConfig = db.prepare(`
      INSERT INTO app_config (key, value)
      VALUES (?, ?)
    `);

    const insertPrinter = db.prepare(`
      INSERT INTO printers (name, model, status, hourly_depreciation, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMaterial = db.prepare(`
      INSERT INTO materials (name, type, color, weight, remaining, price, low_stock_threshold, supplier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        code,
        item_name,
        customer_name,
        printer_id,
        order_status,
        print_hours,
        manual_minutes,
        notes,
        order_date,
        material_cost,
        depreciation_cost,
        electricity_cost,
        labor_cost,
        packaging_cost,
        shipping_cost,
        risk_cost,
        total_cost,
        final_price,
        profit
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMovement = db.prepare(`
      INSERT INTO stock_movements (
        material_id,
        material_name,
        movement_type,
        quantity,
        reason,
        reference_code
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    Object.entries(payload.config || {}).forEach(([key, value]) => {
      insertConfig.run(String(key), String(value));
    });

    (payload.printers || []).forEach((printer) => {
      insertPrinter.run(
        printer.name,
        printer.model || '',
        printer.status || 'idle',
        Number(printer.hourlyDepreciation || 0),
        printer.notes || ''
      );
    });

    (payload.materials || []).forEach((material) => {
      insertMaterial.run(
        material.name,
        material.type || '',
        material.color || '',
        Number(material.weight || 0),
        Number(material.remaining || 0),
        Number(material.price || 0),
        Number(material.lowStockThreshold || 0),
        material.supplier || ''
      );
    });

    (payload.orders || []).forEach((order) => {
      insertOrder.run(
        order.code,
        order.itemName,
        order.customerName || '',
        order.printerId ? Number(order.printerId) : null,
        order.status || 'new',
        Number(order.printHours || 0),
        Number(order.manualMinutes || 0),
        order.notes || '',
        order.date,
        Number(order.materialCost || 0),
        Number(order.depreciationCost || 0),
        Number(order.electricityCost || 0),
        Number(order.laborCost || 0),
        Number(order.packagingCost || 0),
        Number(order.shippingCost || 0),
        Number(order.riskCost || 0),
        Number(order.totalCost || 0),
        Number(order.finalPrice || 0),
        Number(order.profit || 0)
      );
    });

    (payload.stockMovements || []).forEach((movement) => {
      insertMovement.run(
        Number(movement.materialId || 0),
        movement.materialName || '',
        movement.movementType || 'adjust_in',
        Number(movement.quantity || 0),
        movement.reason || '',
        movement.referenceCode || ''
      );
    });
  });

  transaction(data);
}

function exportBackupData() {
  return getDashboardData();
}

module.exports = {
  getDb,
  getDashboardData,
  getNextOrderCode,
  setConfig,
  createPrinter,
  updatePrinter,
  deletePrinter,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  createOrder,
  updateOrder,
  deleteOrder,
  replaceAllData,
  exportBackupData
};
