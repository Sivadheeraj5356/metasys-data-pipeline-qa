const assert = require('node:assert/strict');
const { audit, parseRows } = require('./app.js');
const rows = parseRows('order_id,customer_id,amount,updated_at\nORD-1,C-1,10,2026-10-21\nORD-1,,bad,not-a-date');
const result = audit(rows);
assert.equal(result.rowCount, 2);
assert.ok(result.issues.some((issue) => issue.issue.includes('Order "ORD-1"')));
assert.ok(result.issues.some((issue) => issue.issue.includes('not a valid non-negative number')));
console.log('3 tests passed');
