import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import {meta} from './dist/catalog.js';
import {paidResources} from './dist/paid.js';

const dataDirectory = new URL('./dist/data/', import.meta.url);
const files = readdirSync(dataDirectory).filter(name => name.endsWith('.json'));
const maps = files.map(name => JSON.parse(readFileSync(new URL(name, dataDirectory), 'utf8')));
const editorial = JSON.parse(readFileSync(new URL('./editorial.json', import.meta.url), 'utf8'));

function unique(values, field) {
  assert.equal(new Set(values).size, values.length, `Entrada duplicada em ${field}`);
}

function requireText(record, fields) {
  for (const field of fields) {
    assert.ok(typeof record[field] === 'string' && record[field].trim(), `${record.id}: campo vazio em ${field}`);
  }
}

function checkLink(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', value);
  assert.ok(!url.username && !url.password, value);
}

test('catálogo e inventário editorial', () => {
  unique(maps.map(map => map.id), 'IDs de mapa');
  assert.deepEqual(Object.keys(meta).sort(), maps.map(map => map.id).sort(), 'Os mapas publicados devem ter uma entrada no catálogo e seu próprio arquivo de estudo.');
  for (const map of maps) {
    assert.equal(meta[map.id].name, map.title);
    assert.ok(editorial.groups.includes(meta[map.id].group));
  }
  unique(editorial.groups, 'grupos');
  assert.deepEqual(Object.keys(editorial.planned).sort(), [...editorial.groups].sort());
  const planned = editorial.groups.flatMap(group => editorial.planned[group]);
  assert.ok(planned.every(title => typeof title === 'string' && title.trim()));
  unique([...maps.map(map => map.title), ...planned].map(title => title.toLocaleLowerCase('pt-BR')), 'títulos publicados ou planejados');
});

for (const [index, map] of maps.entries()) {
  test(`integridade de ${map.id}`, () => {
    requireText(map, ['id', 'title']);
    assert.equal(files[index], `${map.id}.json`);
    assert.ok(map.nodes.length && map.resources.length);
    unique(map.nodes.map(node => node.id), 'IDs de tópico');
    unique(map.resources.map(resource => resource.id), 'IDs de fonte');

    const knownNodes = new Set();
    const uses = new Map(map.resources.map(resource => [resource.id, []]));
    for (const node of map.nodes) {
      requireText(node, ['id', 'title', 'body', 'objective']);
      assert.match(node.id, /^[a-z0-9-]+$/);
      assert.ok(knownNodes.size ? knownNodes.has(node.parent) : node.parent === null, `Origem inválida em ${node.id}`);
      knownNodes.add(node.id);
      assert.ok(['sequence', 'prerequisite', 'related'].includes(node.relation), node.id);
      assert.ok(['center', 'left', 'right'].includes(node.lane), node.id);
      assert.ok(Array.isArray(node.resources) && node.resources.length >= 2, `Menos de dois materiais em ${map.id}/${node.id}`);
      unique(node.resources, `leituras de ${node.id}`);
      assert.ok(node.resources.filter(id=>map.resources.find(r=>r.id===id)?.language.startsWith('pt')).length>=2,
        `Cada tópico precisa de duas fontes em português: ${map.id}/${node.id}`);
      if (['base','acp','sistemica','analise-do-comportamento','neurociencia'].includes(map.id)) {
        assert.deepEqual(Object.keys(node.resourceGuides || {}).sort(), [...node.resources].sort(),
          'Cada material deve indicar o que estudar em '+map.id+'/'+node.id);
      }
      for(const [id, guide] of Object.entries(node.resourceGuides || {})){
        assert.ok(node.resources.includes(id) && typeof guide==='string' && guide.trim(), 'Orientação de leitura inválida em '+node.id);
      }
      for (const id of node.resources) {
        assert.ok(uses.has(id), `Fonte ${id} ausente em ${node.id}`);
        uses.get(id).push(node.id);
      }
    }

    for (const resource of map.resources) {
      requireText(resource, ['id', 'title', 'authors', 'institution', 'language', 'format', 'url', 'access', 'checkedAt', 'verification', 'rights', 'caveat', 'relevance']);
      checkLink(resource.url);
      if (resource.sourcePage != null) checkLink(resource.sourcePage);
      assert.ok(resource.year === null || Number.isInteger(resource.year), resource.id);
      assert.match(resource.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(new Date(resource.checkedAt).toISOString().slice(0, 10), resource.checkedAt);
      const usedBy = uses.get(resource.id);
      assert.ok(usedBy.length, `Fonte órfã: ${resource.id}`);
      assert.deepEqual([...resource.nodes].sort(), [...usedBy].sort(), `Vínculos divergentes em ${resource.id}`);
    }
  });
}

test('cada mapa publicado tem um PDF para baixar', () => {
  const posters = new URL('./dist/pdf/', import.meta.url);
  assert.deepEqual(readdirSync(posters).filter(name=>name.endsWith('.pdf')).sort(), maps.map(m=>m.id+'.pdf').sort());
  for (const map of maps) {
    const pdf = readFileSync(new URL(map.id+'.pdf', posters));
    assert.equal(pdf.subarray(0,5).toString(), '%PDF-', map.id);
    assert.match(pdf.subarray(-12).toString(), /%%EOF\s*$/, map.id);
  }
});

test('seleção paga e vínculo com tópicos gratuitos', () => {
  unique(paidResources.map(r=>r.id), 'ID de recurso pago');
  unique(paidResources.map(r=>r.url), 'URL de recurso pago');
  for(const id of ['psicanalise','tcc']) assert.ok(paidResources.some(r=>r.map===id));
  const freeUrls = new Set(maps.flatMap(m=>m.resources.map(r=>r.url)));
  for(const r of paidResources){
    requireText(r,['id','map','title','authors','publisher','format','url','why']);
    checkLink(r.url);
    assert.ok(!freeUrls.has(r.url),'Link comercial usado como material gratuito');
    const map = maps.find(m=>m.id===r.map);
    assert.ok(map, r.id+' precisa indicar um mapa');
    if (r.relatedTopics !== undefined) assert.ok(Array.isArray(r.relatedTopics), r.id);
    const topics = [r.topic, ...(r.relatedTopics || [])];
    unique(topics, 'vínculos de '+r.id);
    for (const id of topics) assert.ok(map.nodes.some(n=>n.id===id), r.id+' aponta para um tópico ausente: '+id);
  }
});
