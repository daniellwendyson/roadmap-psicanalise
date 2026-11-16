import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {meta} from './dist/catalog.js';
import {guidance} from './dist/guidance.js';

test('marcadores editoriais e escolhas dentro de cada mapa', () => {
  for (const [mapId, entries] of Object.entries(guidance)) {
    assert.ok(Object.hasOwn(meta, mapId), mapId);
    const map = JSON.parse(readFileSync(new URL(`./dist/data/${mapId}.json`, import.meta.url), 'utf8'));
    const groups = new Map();
    for (const [nodeId, {role, note, group}] of Object.entries(entries)) {
      const node = map.nodes.find(item => item.id === nodeId);
      assert.ok(node, `Tópico inexistente: ${mapId}/${nodeId}`);
      assert.ok(['recommended', 'alternative', 'anytime'].includes(role), nodeId);
      assert.ok(note?.trim(), `Orientação de leitura ausente: ${nodeId}`);
      if (role === 'alternative') assert.ok(group, nodeId);
      if (role === 'anytime') assert.equal(group, undefined, nodeId);
      if (group) {
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push({role, parent: node.parent});
      }
    }
    for (const [group, choices] of groups) {
      const label = `${mapId}/${group}`;
      assert.equal(choices.filter(choice => choice.role === 'recommended').length, 1, label);
      assert.ok(choices.some(choice => choice.role === 'alternative'), label);
      assert.equal(new Set(choices.map(choice => choice.parent)).size, 1, label);
    }
  }
});
