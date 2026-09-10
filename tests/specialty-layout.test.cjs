const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

// Execute the production transfer function, without introducing a browser dependency.
const script = readFileSync(join(__dirname, '../script.js'), 'utf8');
const source = script.slice(script.indexOf('function moveSpecialtyInRows('), script.indexOf('function clearSpecialtyGhosts('));
const move = runInNewContext(`${source}\nmoveSpecialtyInRows`);

test('a full second row transfers a neighbor into the first row', () => {
  const rows = [[0, 1, 2, 3], [4, 5, 6, 7, 8]];
  move(rows, 0, 8);
  assert.deepEqual(rows, [[0, 7, 1, 2, 3], [4, 5, 6, 8]]);
});

test('same-row activation preserves order', () => {
  const rows = [[0, 1, 2, 3], [4, 5, 6, 7, 8]];
  move(rows, 0, 3);
  assert.deepEqual(rows, [[0, 1, 2, 3], [4, 5, 6, 7, 8]]);
});

test('successive selections keep all nine cards and exactly fill two rows', () => {
  const rows = [[0, 1, 2, 3], [4, 5, 6, 7, 8]];
  let previous = 0;
  for (let iteration = 0; iteration < 10000; iteration++) {
    const next = (iteration * 7 + Math.floor(iteration / 13)) % 9;
    const targetRow = rows.findIndex(row => row.includes(next));
    move(rows, previous, next);
    assert.equal(rows.findIndex(row => row.includes(next)), targetRow);
    assert.deepEqual(rows.flat().sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    rows.forEach(row => assert.equal(row.length + Number(row.includes(next)), 5));
    previous = next;
  }
});
