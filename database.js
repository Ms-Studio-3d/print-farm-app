const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db = null;

function getDatabasePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, '3d-printing-business-manager.db');
}

function getDb() {
  if (db) return db;

  db = new Database(getDatabasePath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  createTables();
  runMigrations();
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
      is_archived INTEGER NOT NULL DEFAULT 0,
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
      is_archived INTEGER NOT NULL DEFAULT 0,
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
      tax_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      price_before_discount REAL NOT NULL DEFAULT 0,
      discount_value REAL NOT NULL DEFAULT 0,
      price_after_discount REAL NOT NULL DEFAULT 0,
      rounded_adjustment REAL NOT NULL DEFAULT 0,
      final_price REAL NOT NULL DEFAULT 0,
      profit REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      material_id INTEGER,
      material_name TEXT NOT NULL,
      grams REAL NOT NULL DEFAULT 0,
      price_per_gram REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER,
      material_name TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      reason TEXT DEFAULT '',
      reference_code TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
    );
  `);
}

function runMigrations() {
  ensureColumnExists('materials', 'supplier', `ALTER TABLE materials ADD COLUMN supplier TEXT DEFAULT ''`);
  ensureColumnExists('materials', 'low_stock_threshold', `ALTER TABLE materials ADD COLUMN low_stock_threshold REAL NOT NULL DEFAULT 150`);
  ensureColumnExists('materials', 'is_archived', `ALTER TABLE materials ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0`);

  ensureColumnExists('printers', 'model', `ALTER TABLE printers ADD COLUMN model TEXT DEFAULT ''`);
  ensureColumnExists('printers', 'status', `ALTER TABLE printers ADD COLUMN status TEXT DEFAULT 'idle'`);
  ensureColumnExists('printers', 'hourly_depreciation', `ALTER TABLE printers ADD COLUMN hourly_depreciation REAL DEFAULT 0`);
  ensureColumnExists('printers', 'notes', `ALTER TABLE printers ADD COLUMN notes TEXT DEFAULT ''`);
  ensureColumnExists('printers', 'is_archived', `ALTER TABLE printers ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0`);

  ensureColumnExists('orders', 'order_status', `ALTER TABLE orders ADD COLUMN order_status TEXT DEFAULT 'new'`);
  ensureColumnExists('orders', 'print_hours', `ALTER TABLE orders ADD COLUMN print_hours REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'manual_minutes', `ALTER TABLE orders ADD COLUMN manual_minutes REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'material_cost', `ALTER TABLE orders ADD COLUMN material_cost REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'depreciation_cost', `ALTER TABLE orders ADD COLUMN depreciation_cost REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'electricity_cost', `ALTER TABLE orders ADD COLUMN electricity_cost REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'labor_cost', `ALTER TABLE orders ADD COLUMN labor_cost REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'packaging_cost', `ALTER TABLE orders ADD COLUMN packaging_cost REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'shipping_cost', `ALTER TABLE orders ADD COLUMN shipping_cost REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'risk_cost', `ALTER TABLE orders ADD COLUMN risk_cost REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'tax_cost', `ALTER TABLE orders ADD COLUMN tax_cost REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'price_before_discount', `ALTER TABLE orders ADD COLUMN price_before_discount REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'discount_value', `ALTER TABLE orders ADD COLUMN discount_value REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'price_after_discount', `ALTER TABLE orders ADD COLUMN price_after_discount REAL NOT NULL DEFAULT 0`);
  ensureColumnExists('orders', 'rounded_adjustment', `ALTER TABLE orders ADD COLUMN rounded_adjustment REAL NOT NULL DEFAULT 0`);

  backfillPricingBreakdown();
}

function ensureColumnExists(tableName, columnName, alterSql) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((col) => col.name === columnName);

  if (!exists) {
    db.exec(alterSql);
  }
}

function backfillPricingBreakdown() {
  db.prepare(`
    UPDATE orders
    SET
      price_before_discount = CASE
        WHEN price_before_discount IS NULL OR price_before_discount = 0 THEN final_price
        ELSE price_before_discount
      END,
      price_after_discount = CASE
        WHEN price_after_discount IS NULL OR price_after_discount = 0 THEN final_price
        ELSE price_after_discount
      END
  `).run();
}

function seedDefaults() {
  const printersCount = db.prepare('SELECT COUNT(*) AS count FROM printers').get().count;
  const materialsCount = db.prepare('SELECT COUNT(*) AS count FROM materials').get().count;

  const defaults = {
    farmName: 'Print Farm App',
    currencyName: 'جنيه',
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

  const currentFarmName = db.prepare(`SELECT value FROM app_config WHERE key = 'farmName'`).get();

  if (!currentFarmName || !String(currentFarmName.value || '').trim()) {
    db.prepare(`
      INSERT INTO app_config (key, value)
      VALUES ('farmName', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(defaults.farmName);
  }

  const currentCurrencyName = db.prepare(`SELECT value FROM app_config WHERE key = 'currencyName'`).get();

  if (
    !currentCurrencyName ||
    !String(currentCurrencyName.value || '').trim() ||
    String(currentCurrencyName.value || '').trim() === 'ج'
  ) {
    db.prepare(`
      INSERT INTO app_config (key, value)
      VALUES ('currencyName', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(defaults.currencyName);
  }

  if (printersCount === 0) {
    const insertPrinter = db.prepare(`
      INSERT INTO printers (name, model, status, hourly_depreciation, notes, is_archived)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertPrinter.run(
      'Bambu Lab A1',
      'A1',
      'idle',
      0,
      'الطابعة الأساسية - Bambu Lab A1',
      0
    );
  }

  if (materialsCount === 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO materials (name, type, color, weight, remaining, price, low_stock_threshold, supplier, is_archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMaterial.run('PLA Black', 'PLA', 'Black', 1000, 1000, 800, 150, '', 0);
    insertMaterial.run('PLA White', 'PLA', 'White', 1000, 1000, 800, 150, '', 0);
    insertMaterial.run('PLA Red', 'PLA', 'Red', 1000, 1000, 800, 150, '', 0);
    insertMaterial.run('PLA Silk Gold', 'PLA Silk', 'Gold', 1000, 1000, 1200, 150, '', 0);
  }
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
  `).run(String(key), String(value));
}

function getDashboardData() {
  const printers = db.prepare(`
    SELECT
      id,
      name,
      model,
      status,
      hourly_depreciation AS hourlyDepreciation,
      notes,
      is_archived AS isArchived
    FROM printers
    WHERE is_archived = 0
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
      supplier,
      is_archived AS isArchived
    FROM materials
    WHERE is_archived = 0
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
      o.tax_cost AS taxCost,
      o.total_cost AS totalCost,
      o.price_before_discount AS priceBeforeDiscount,
      o.discount_value AS discountValue,
      o.price_after_discount AS priceAfterDiscount,
      o.rounded_adjustment AS roundedAdjustment,
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
    LIMIT 1000
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
    INSERT INTO printers (name, model, status, hourly_depreciation, notes, is_archived)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    String(data.name || '').trim(),
    String(data.model || '').trim(),
    String(data.status || 'idle').trim(),
    Number(data.hourlyDepreciation || 0),
    String(data.notes || '').trim(),
    0
  );

  return Number(result.lastInsertRowid);
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
    String(data.name || '').trim(),
    String(data.model || '').trim(),
    String(data.status || 'idle').trim(),
    Number(data.hourlyDepreciation || 0),
    String(data.notes || '').trim(),
    Number(data.id)
  );
}

function deletePrinter(id) {
  const printerId = Number(id);
  const printer = db.prepare('SELECT id FROM printers WHERE id = ?').get(printerId);

  if (!printer) {
    return { deleted: false, archived: false, reason: 'not_found' };
  }

  const usageCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM orders
    WHERE printer_id = ?
  `).get(printerId).count;

  if (usageCount > 0) {
    db.prepare(`
      UPDATE printers
      SET is_archived = 1
      WHERE id = ?
    `).run(printerId);

    return { deleted: false, archived: true, reason: 'used_in_orders' };
  }

  db.prepare('DELETE FROM printers WHERE id = ?').run(printerId);
  return { deleted: true, archived: false, reason: 'deleted' };
}

function createMaterial(data) {
  const stmt = db.prepare(`
    INSERT INTO materials (name, type, color, weight, remaining, price, low_stock_threshold, supplier, is_archived)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    String(data.name || '').trim(),
    String(data.type || '').trim(),
    String(data.color || '').trim(),
    Number(data.weight || 0),
    Number(data.remaining || 0),
    Number(data.price || 0),
    Number(data.lowStockThreshold || 0),
    String(data.supplier || '').trim(),
    0
  );

  const materialId = Number(result.lastInsertRowid);

  db.prepare(`
    INSERT INTO stock_movements (material_id, material_name, movement_type, quantity, reason, reference_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    materialId,
    String(data.name || '').trim(),
    'in',
    Number(data.remaining || 0),
    'إضافة خامة جديدة',
    ''
  );

  return materialId;
}

function updateMaterial(data) {
  const materialId = Number(data.id);
  const oldMaterial = db.prepare('SELECT * FROM materials WHERE id = ?').get(materialId);

  if (!oldMaterial) return;

  const newName = String(data.name || '').trim();
  const newRemaining = Number(data.remaining || 0);

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
    newName,
    String(data.type || '').trim(),
    String(data.color || '').trim(),
    Number(data.weight || 0),
    newRemaining,
    Number(data.price || 0),
    Number(data.lowStockThreshold || 0),
    String(data.supplier || '').trim(),
    materialId
  );

  if (String(oldMaterial.name || '') !== newName) {
    db.prepare(`
      UPDATE order_materials
      SET material_name = ?
      WHERE material_id = ?
    `).run(newName, materialId);

    db.prepare(`
      UPDATE stock_movements
      SET material_name = ?
      WHERE material_id = ?
    `).run(newName, materialId);
  }

  const difference = newRemaining - Number(oldMaterial.remaining || 0);

  if (difference !== 0) {
    db.prepare(`
      INSERT INTO stock_movements (material_id, material_name, movement_type, quantity, reason, reference_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      materialId,
      newName,
      difference > 0 ? 'adjust_in' : 'adjust_out',
      Math.abs(difference),
      'تعديل يدوي على المخزون',
      ''
    );
  }
}

function deleteMaterial(id) {
  const materialId = Number(id);
  const material = db.prepare('SELECT id FROM materials WHERE id = ?').get(materialId);

  if (!material) {
    return { deleted: false, archived: false, reason: 'not_found' };
  }

  const usageCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM order_materials
    WHERE material_id = ?
  `).get(materialId).count;

  if (usageCount > 0) {
    db.prepare(`
      UPDATE materials
      SET is_archived = 1
      WHERE id = ?
    `).run(materialId);

    return { deleted: false, archived: true, reason: 'used_in_orders' };
  }

  db.prepare('DELETE FROM stock_movements WHERE material_id = ?').run(materialId);
  db.prepare('DELETE FROM materials WHERE id = ?').run(materialId);

  return { deleted: true, archived: false, reason: 'deleted' };
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

  if (!match) {
    return 'ORD-1001';
  }

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
      tax_cost,
      total_cost,
      price_before_discount,
      discount_value,
      price_after_discount,
      rounded_adjustment,
      final_price,
      profit
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    WHERE id = ? AND remaining >= ? AND is_archived = 0
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
    if (!data || !String(data.code || '').trim()) {
      throw new Error('كود الأوردر غير صالح');
    }

    if (!String(data.itemName || '').trim()) {
      throw new Error('اسم المجسم مطلوب');
    }

    if (!Array.isArray(data.materialUsage) || data.materialUsage.length === 0) {
      throw new Error('لا يوجد استهلاك خامات في الأوردر');
    }

    const existingCode = db.prepare('SELECT id FROM orders WHERE code = ?').get(String(data.code || '').trim());

    if (existingCode) {
      throw new Error('كود الأوردر موجود بالفعل، حاول مرة أخرى');
    }

    for (const item of data.materialUsage) {
      const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(Number(item.materialId));

      if (!material) {
        throw new Error(`الخامة غير موجودة: ${item.materialName}`);
      }

      if (Number(material.is_archived || 0) === 1) {
        throw new Error(`الخامة مؤرشفة ولا يمكن استخدامها: ${item.materialName}`);
      }

      if (Number(material.remaining || 0) < Number(item.grams || 0)) {
        throw new Error(`المخزون غير كافٍ في: ${item.materialName}`);
      }
    }

    if (data.printerId) {
      const printer = db.prepare('SELECT id, is_archived FROM printers WHERE id = ?').get(Number(data.printerId));

      if (!printer) {
        throw new Error('الطابعة المحددة غير موجودة');
      }

      if (Number(printer.is_archived || 0) === 1) {
        throw new Error('الطابعة المحددة مؤرشفة ولا يمكن استخدامها');
      }
    }

    const finalPrice = Number(data.finalPrice || 0);

    const orderResult = insertOrder.run(
      String(data.code || '').trim(),
      String(data.itemName || '').trim(),
      String(data.customerName || '').trim(),
      data.printerId ? Number(data.printerId) : null,
      String(data.status || 'new').trim(),
      Number(data.printHours || 0),
      Number(data.manualMinutes || 0),
      String(data.notes || '').trim(),
      String(data.date || '').trim(),
      Number(data.materialCost || 0),
      Number(data.depreciationCost || 0),
      Number(data.electricityCost || 0),
      Number(data.laborCost || 0),
      Number(data.packagingCost || 0),
      Number(data.shippingCost || 0),
      Number(data.riskCost || 0),
      Number(data.taxCost || 0),
      Number(data.totalCost || 0),
      Number(data.priceBeforeDiscount || finalPrice),
      Number(data.discountValue || 0),
      Number(data.priceAfterDiscount || finalPrice),
      Number(data.roundedAdjustment || 0),
      finalPrice,
      Number(data.profit || 0)
    );

    const orderId = Number(orderResult.lastInsertRowid);

    for (const item of data.materialUsage) {
      const result = updateMaterialStock.run(
        Number(item.grams || 0),
        Number(item.materialId),
        Number(item.grams || 0)
      );

      if (result.changes === 0) {
        throw new Error(`تعذر خصم المخزون من: ${item.materialName}`);
      }

      insertMaterialUsage.run(
        orderId,
        Number(item.materialId),
        String(item.materialName || '').trim(),
        Number(item.grams || 0),
        Number(item.pricePerGram || 0),
        Number(item.totalCost || 0)
      );

      insertStockMovement.run(
        Number(item.materialId),
        String(item.materialName || '').trim(),
        'out',
        Number(item.grams || 0),
        'استهلاك في أوردر',
        String(data.code || '').trim()
      );
    }

    return orderId;
  });

  return transaction(payload);
}

function updateOrder(payload) {
  const code = String(payload.code || '').trim();

  if (!code) {
    throw new Error('كود الأوردر غير صالح');
  }

  const transaction = db.transaction((data) => {
    const existingOrder = db.prepare('SELECT id, code FROM orders WHERE code = ?').get(code);

    if (!existingOrder) {
      throw new Error('الأوردر غير موجود');
    }

    if (!String(data.itemName || '').trim()) {
      throw new Error('اسم المجسم مطلوب');
    }

    if (data.printerId) {
      const printer = db.prepare('SELECT id, is_archived FROM printers WHERE id = ?').get(Number(data.printerId));

      if (!printer) {
        throw new Error('الطابعة المحددة غير موجودة');
      }

      if (Number(printer.is_archived || 0) === 1) {
        throw new Error('الطابعة المحددة مؤرشفة ولا يمكن استخدامها');
      }
    }

    const shouldReplaceMaterialUsage = Array.isArray(data.materialUsage);

    if (shouldReplaceMaterialUsage) {
      if (data.materialUsage.length === 0) {
        throw new Error('لا يوجد استهلاك خامات في الأوردر');
      }

      const oldMaterials = db.prepare(`
        SELECT material_id AS materialId, material_name AS materialName, grams
        FROM order_materials
        WHERE order_id = ?
      `).all(existingOrder.id);

      for (const item of oldMaterials) {
        if (item.materialId) {
          db.prepare(`
            UPDATE materials
            SET remaining = remaining + ?
            WHERE id = ?
          `).run(Number(item.grams || 0), Number(item.materialId));
        }

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
          item.materialId ? Number(item.materialId) : null,
          String(item.materialName || '').trim(),
          'return',
          Number(item.grams || 0),
          'استرجاع قبل تعديل أوردر',
          String(existingOrder.code || '').trim()
        );
      }

      db.prepare('DELETE FROM order_materials WHERE order_id = ?').run(existingOrder.id);

      for (const item of data.materialUsage) {
        const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(Number(item.materialId));

        if (!material) {
          throw new Error(`الخامة غير موجودة: ${item.materialName}`);
        }

        if (Number(material.is_archived || 0) === 1) {
          throw new Error(`الخامة مؤرشفة ولا يمكن استخدامها: ${item.materialName}`);
        }

        if (Number(material.remaining || 0) < Number(item.grams || 0)) {
          throw new Error(`المخزون غير كافٍ في: ${item.materialName}`);
        }

        const result = db.prepare(`
          UPDATE materials
          SET remaining = remaining - ?
          WHERE id = ? AND remaining >= ? AND is_archived = 0
        `).run(
          Number(item.grams || 0),
          Number(item.materialId),
          Number(item.grams || 0)
        );

        if (result.changes === 0) {
          throw new Error(`تعذر خصم المخزون من: ${item.materialName}`);
        }

        db.prepare(`
          INSERT INTO order_materials (
            order_id,
            material_id,
            material_name,
            grams,
            price_per_gram,
            total_cost
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          existingOrder.id,
          Number(item.materialId),
          String(item.materialName || '').trim(),
          Number(item.grams || 0),
          Number(item.pricePerGram || 0),
          Number(item.totalCost || 0)
        );

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
          String(item.materialName || '').trim(),
          'out',
          Number(item.grams || 0),
          'استهلاك بعد تعديل أوردر',
          String(existingOrder.code || '').trim()
        );
      }
    }

    const finalPrice = Number(data.finalPrice || 0);

    db.prepare(`
      UPDATE orders
      SET
        item_name = ?,
        customer_name = ?,
        printer_id = ?,
        order_status = ?,
        print_hours = ?,
        manual_minutes = ?,
        notes = ?,
        order_date = ?,
        material_cost = ?,
        depreciation_cost = ?,
        electricity_cost = ?,
        labor_cost = ?,
        packaging_cost = ?,
        shipping_cost = ?,
        risk_cost = ?,
        tax_cost = ?,
        total_cost = ?,
        price_before_discount = ?,
        discount_value = ?,
        price_after_discount = ?,
        rounded_adjustment = ?,
        final_price = ?,
        profit = ?
      WHERE code = ?
    `).run(
      String(data.itemName || '').trim(),
      String(data.customerName || '').trim(),
      data.printerId ? Number(data.printerId) : null,
      String(data.status || 'new').trim(),
      Number(data.printHours || 0),
      Number(data.manualMinutes || 0),
      String(data.notes || '').trim(),
      String(data.date || '').trim(),
      Number(data.materialCost || 0),
      Number(data.depreciationCost || 0),
      Number(data.electricityCost || 0),
      Number(data.laborCost || 0),
      Number(data.packagingCost || 0),
      Number(data.shippingCost || 0),
      Number(data.riskCost || 0),
      Number(data.taxCost || 0),
      Number(data.totalCost || 0),
      Number(data.priceBeforeDiscount || finalPrice),
      Number(data.discountValue || 0),
      Number(data.priceAfterDiscount || finalPrice),
      Number(data.roundedAdjustment || 0),
      finalPrice,
      Number(data.profit || 0),
      code
    );
  });

  transaction(payload);
}

function deleteOrder(code) {
  const order = db.prepare('SELECT id, code FROM orders WHERE code = ?').get(String(code || '').trim());

  if (!order) return;

  const materials = db.prepare(`
    SELECT material_id AS materialId, material_name AS materialName, grams
    FROM order_materials
    WHERE order_id = ?
  `).all(order.id);

  const transaction = db.transaction(() => {
    for (const item of materials) {
      if (item.materialId) {
        db.prepare(`
          UPDATE materials
          SET remaining = remaining + ?
          WHERE id = ?
        `).run(Number(item.grams || 0), Number(item.materialId));
      }

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
        item.materialId ? Number(item.materialId) : null,
        String(item.materialName || '').trim(),
        'return',
        Number(item.grams || 0),
        'استرجاع بعد حذف أوردر',
        String(order.code || '').trim()
      );
    }

    db.prepare('DELETE FROM order_materials WHERE order_id = ?').run(order.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(order.id);
  });

  transaction();
}

function replaceAllData(data) {
  const payload = data && typeof data === 'object' ? data : {};

  const transaction = db.transaction(() => {
    db.exec(`
      DELETE FROM order_materials;
      DELETE FROM stock_movements;
      DELETE FROM orders;
      DELETE FROM materials;
      DELETE FROM printers;
      DELETE FROM app_config;
      DELETE FROM sqlite_sequence WHERE name IN ('printers', 'materials', 'orders', 'order_materials', 'stock_movements');
    `);

    const insertConfig = db.prepare(`
      INSERT INTO app_config (key, value)
      VALUES (?, ?)
    `);

    const insertPrinter = db.prepare(`
      INSERT INTO printers (name, model, status, hourly_depreciation, notes, is_archived)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMaterial = db.prepare(`
      INSERT INTO materials (name, type, color, weight, remaining, price, low_stock_threshold, supplier, is_archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        tax_cost,
        total_cost,
        price_before_discount,
        discount_value,
        price_after_discount,
        rounded_adjustment,
        final_price,
        profit
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    const insertOrderMaterial = db.prepare(`
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

    Object.entries(payload.config || {}).forEach(([key, value]) => {
      const safeKey = String(key);
      let safeValue = String(value);

      if (safeKey === 'currencyName' && safeValue.trim() === 'ج') {
        safeValue = 'جنيه';
      }

      insertConfig.run(safeKey, safeValue);
    });

    const printerIdMap = new Map();
    const materialIdMap = new Map();
    const orderIdMap = new Map();

    (payload.printers || []).forEach((printer) => {
      const result = insertPrinter.run(
        String(printer.name || '').trim(),
        String(printer.model || '').trim(),
        String(printer.status || 'idle').trim(),
        Number(printer.hourlyDepreciation || 0),
        String(printer.notes || '').trim(),
        Number(printer.isArchived ? 1 : 0)
      );

      if (printer.id != null) {
        printerIdMap.set(Number(printer.id), Number(result.lastInsertRowid));
      }
    });

    (payload.materials || []).forEach((material) => {
      const result = insertMaterial.run(
        String(material.name || '').trim(),
        String(material.type || '').trim(),
        String(material.color || '').trim(),
        Number(material.weight || 0),
        Number(material.remaining || 0),
        Number(material.price || 0),
        Number(material.lowStockThreshold || 0),
        String(material.supplier || '').trim(),
        Number(material.isArchived ? 1 : 0)
      );

      if (material.id != null) {
        materialIdMap.set(Number(material.id), Number(result.lastInsertRowid));
      }
    });

    (payload.orders || []).forEach((order) => {
      const mappedPrinterId = order.printerId != null
        ? (printerIdMap.get(Number(order.printerId)) ?? null)
        : null;

      const finalPrice = Number(order.finalPrice || 0);

      const result = insertOrder.run(
        String(order.code || '').trim(),
        String(order.itemName || '').trim(),
        String(order.customerName || '').trim(),
        mappedPrinterId,
        String(order.status || 'new').trim(),
        Number(order.printHours || 0),
        Number(order.manualMinutes || 0),
        String(order.notes || '').trim(),
        String(order.date || '').trim(),
        Number(order.materialCost || 0),
        Number(order.depreciationCost || 0),
        Number(order.electricityCost || 0),
        Number(order.laborCost || 0),
        Number(order.packagingCost || 0),
        Number(order.shippingCost || 0),
        Number(order.riskCost || 0),
        Number(order.taxCost || 0),
        Number(order.totalCost || 0),
        Number(order.priceBeforeDiscount || finalPrice),
        Number(order.discountValue || 0),
        Number(order.priceAfterDiscount || finalPrice),
        Number(order.roundedAdjustment || 0),
        finalPrice,
        Number(order.profit || 0)
      );

      if (order.id != null) {
        orderIdMap.set(Number(order.id), Number(result.lastInsertRowid));
      }
    });

    (payload.orderMaterials || []).forEach((item) => {
      const mappedOrderId = orderIdMap.get(Number(item.orderId));

      if (!mappedOrderId) return;

      const mappedMaterialId = item.materialId != null
        ? (materialIdMap.get(Number(item.materialId)) ?? null)
        : null;

      insertOrderMaterial.run(
        mappedOrderId,
        mappedMaterialId,
        String(item.materialName || '').trim(),
        Number(item.grams || 0),
        Number(item.pricePerGram || 0),
        Number(item.totalCost || 0)
      );
    });

    (payload.stockMovements || []).forEach((movement) => {
      const mappedMaterialId = movement.materialId != null
        ? (materialIdMap.get(Number(movement.materialId)) ?? null)
        : null;

      insertMovement.run(
        mappedMaterialId,
        String(movement.materialName || '').trim(),
        String(movement.movementType || 'adjust_in').trim(),
        Number(movement.quantity || 0),
        String(movement.reason || '').trim(),
        String(movement.referenceCode || '').trim()
      );
    });

    seedDefaults();
  });

  transaction();
}

function exportBackupData() {
  const data = getDashboardData();

  const orderMaterials = db.prepare(`
    SELECT
      id,
      order_id AS orderId,
      material_id AS materialId,
      material_name AS materialName,
      grams,
      price_per_gram AS pricePerGram,
      total_cost AS totalCost
    FROM order_materials
    ORDER BY id ASC
  `).all();

  const archivedPrinters = db.prepare(`
    SELECT
      id,
      name,
      model,
      status,
      hourly_depreciation AS hourlyDepreciation,
      notes,
      is_archived AS isArchived
    FROM printers
    WHERE is_archived = 1
    ORDER BY id DESC
  `).all();

  const archivedMaterials = db.prepare(`
    SELECT
      id,
      name,
      type,
      color,
      weight,
      remaining,
      price,
      low_stock_threshold AS lowStockThreshold,
      supplier,
      is_archived AS isArchived
    FROM materials
    WHERE is_archived = 1
    ORDER BY id DESC
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
    ORDER BY id ASC
  `).all();

  return {
    exportedAt: new Date().toISOString(),
    appName: 'Print Farm App',
    schemaVersion: 4,
    ...data,
    printers: [...data.printers, ...archivedPrinters],
    materials: [...data.materials, ...archivedMaterials],
    stockMovements,
    orderMaterials
  };
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
