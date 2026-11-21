const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function makeProduct(stock, reserved = 0) {
  return { id: 1, sku: 'TEST-001', name: 'Test product', hsn: '1006', price: 50, stock, reserved };
}

function makeOrderLine(product, qty) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty
  };
}

function stockLevels(product) {
  return { stock: product.stock, reserved: product.reserved };
}

const oneSellableError = {
  ok: false,
  msg: 'Test product is out of stock (1 sellable available)'
};

test('check accepts qty 1 when sellable is 1', () => {
  const product = makeProduct(1);

  assert.deepEqual(inventory.check([product], [makeOrderLine(product, 1)]), { ok: true });
});

test('check rejects qty 2 when sellable is 1', () => {
  const product = makeProduct(1);

  assert.deepEqual(inventory.check([product], [makeOrderLine(product, 2)]), oneSellableError);
});

test('CURRENT BEHAVIOUR: check accepts qty 0 when sellable is 1', () => {
  const product = makeProduct(1);

  assert.deepEqual(inventory.check([product], [makeOrderLine(product, 0)]), { ok: true });
});

test('check accepts qty 1 with stock 4 and reserved 3', () => {
  const product = makeProduct(4, 3);

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [makeOrderLine(product, 1)]), { ok: true });
});

test('cancelling a pending order restores physical stock', () => {
  const product = makeProduct(8, 3);
  const db = { products: [product], orders: [] };
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items: [makeOrderLine(product, 2)] };
  const beforeOrder = stockLevels(product);

  inventory.reserve(db.products, order.items);
  const afterReserve = stockLevels(product);
  db.orders.push(order);

  const result = orders.cancel(db, order.id);
  const afterCancel = stockLevels(product);

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual(beforeOrder, { stock: 8, reserved: 3 });
  assert.deepEqual(afterReserve, { stock: 6, reserved: 3 });
  assert.deepEqual(afterCancel, { stock: 8, reserved: 3 });
});

test('sells exactly the remaining sellable stock and restores it once on cancellation', () => {
  const product = makeProduct(4, 3);
  const items = [makeOrderLine(product, 1)];
  const order = { id: 1001, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };

  assert.deepEqual(inventory.check(db.products, items), { ok: true });
  assert.deepEqual(inventory.check(db.products, [makeOrderLine(product, 2)]), oneSellableError);
  assert.deepEqual(inventory.check(db.products, [...items, ...items]), oneSellableError);

  inventory.reserve(db.products, items);
  assert.deepEqual(stockLevels(product), { stock: 3, reserved: 3 });

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual(stockLevels(product), { stock: 4, reserved: 3 });

  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.deepEqual(stockLevels(product), { stock: 4, reserved: 3 });
});
