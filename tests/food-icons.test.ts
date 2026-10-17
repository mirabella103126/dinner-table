import {test} from 'node:test';
import assert from 'node:assert/strict';
// @ts-ignore Node executes TypeScript directly.
import {foodIcon} from '../lib/food-icons.ts';
test('dish takes precedence over ingredient',()=>{assert.equal(foodIcon('Chicken tacos'),'🌮');assert.equal(foodIcon('Salmon salad'),'🥗');assert.equal(foodIcon('Chicken noodle soup'),'🍜');assert.equal(foodIcon('Shrimp pasta'),'🍝');});
test('normalizes punctuation, case, and accents',()=>{assert.equal(foodIcon('MAC & CHEESE'),'🍝');assert.equal(foodIcon('Crêpes'),'🥞');assert.equal(foodIcon('Hot-dogs'),'🌭');});
test('staples and new foods receive sensible icons',()=>{assert.equal(foodIcon('Salmon'),'🐟');assert.equal(foodIcon('Tacos'),'🌮');assert.equal(foodIcon('Vegetable dumplings'),'🥟');assert.equal(foodIcon('Butter chicken'),'🍛');});
test('unknown names use a plate, not an accidental substring',()=>{assert.equal(foodIcon('Family special'),'🍽️');assert.equal(foodIcon('Riceville Restaurant'),'🍽️');assert.equal(foodIcon(''),'🍽️');});
