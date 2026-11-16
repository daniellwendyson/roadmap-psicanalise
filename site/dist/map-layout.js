// Each band places one or two successive main topics on the sheet. Paired topics
// read horizontally. Their satellite readings sit on the outside of the pair.
const desktopBands = {
  acp: [[480], [345, 615], [475]],
  'analise-do-comportamento': [[480], [615, 345], [365], [600]],
  analitica: [[480], [345, 615], [385], [615, 345]],
  base: [[480], [345, 615], [615, 345], [345, 615]],
  gestalt: [[480], [345, 615], [390], [615, 345], [485]],
  psicanalise: [[480], [345, 615], [390], [615, 345], [345, 615], [475]],
  sistemica: [[480], [375], [615, 345], [495]],
  tcc: [[480], [360], [615, 345], [345, 615], [615, 345], [395], [570]]
};

function labelWidth(text, compact) {
  let units = 0;
  for (const character of text) {
    if ('iljít.,:! '.includes(character)) units += 4.5;
    else if ('mwMWÕÓQG'.includes(character)) units += 11;
    else units += 8;
  }
  return units * (compact ? .9 : 1);
}

function boxHeight(title, w, compact) {
  const available = w - (compact ? 29 : 33);
  let lines = 1, used = 0;
  for (const word of title.split(/\s+/)) {
    const next = labelWidth(word, compact) * (compact ? 1 : 1.09);
    if (used && used + 4 + next > available) { lines++; used = 0; }
    if (next > available) {
      const parts = Math.ceil(next / available);
      lines += parts - 1;
      used = next - (parts-1)*available;
    } else used += next + (used ? 4 : 0);
  }
  return Math.max(compact ? 44 : 42, lines * (compact ? 18 : 20) + 14);
}

function groupTopics(map) {
  const groups = [], owner = new Map();
  for (const node of map.nodes) {
    let group = owner.get(node.parent);
    if (!group || node.lane === 'center') {
      group = {main:node, branches:[]};
      groups.push(group);
    } else group.branches.push(node);
    owner.set(node.id, group);
  }
  return groups;
}

function bandPositions(mapId, count) {
  const preset = desktopBands[mapId];
  if (preset?.flat().length === count) return preset;
  const result = [[480]];
  for (let i = 1; i < count; i += 2) {
    const pair = result.length % 2 === 1 ? [345, 615] : [615, 345];
    result.push(pair.slice(0, count - i));
  }
  return result;
}

function drawEdge(a, b, kind, bendBetweenBands, columnWidth = 0) {
  if (a.band === b.band && a.x !== b.x) {
    const direction = Math.sign(b.x - a.x);
    const start = a.x + direction * a.w / 2, end = b.x - direction * b.w / 2;
    if (a.y === b.y) return `M${start} ${a.y} H${end}`;
    // Keep the curve in the gutter, clear of wider siblings in either column.
    const exit = a.x + direction * Math.max(a.w, columnWidth) / 2;
    const entry = b.x - direction * Math.max(b.w, columnWidth) / 2;
    const bend = (entry - exit) * .48;
    return `M${start} ${a.y} H${exit} C${exit+bend} ${a.y} ${entry-bend} ${b.y} ${entry} ${b.y} H${end}`;
  }
  const start = a.y + a.h/2, end = b.y - b.h/2;
  if (a.x === b.x) return `M${a.x} ${start} V${end}`;
  const exit = bendBetweenBands && kind === 'main' ? Math.max(start, a.bandBottom) : start;
  const entry = bendBetweenBands && kind === 'main' ? Math.min(end, b.bandTop) : end;
  const middle = (exit + entry) / 2;
  return `M${a.x} ${start} V${exit} C${a.x} ${middle} ${b.x} ${middle} ${b.x} ${entry} V${end}`;
}

// Each stage owns a tree of readings. Reserve space for a whole subtree before
// positioning its siblings so an article can have branches of its own.
function branchedLayout(map, groups, compact) {
  const width = compact ? 360 : 960, nodes = new Map();
  const children = new Map(map.nodes.map(node => [node.id, []]));
  for (const node of map.nodes) {
    if (node.parent && node.lane !== 'center') children.get(node.parent).push(node);
  }
  let top = compact ? 26 : 32;
  for (const [band, {main}] of groups.entries()) {
    if (compact) {
      function place(node, depth) {
        const left = 36 + 27 * depth;
        const w = Math.min(350 - left, Math.max(148, Math.ceil(labelWidth(node.title, true)) + 35));
        const h = boxHeight(node.title, w, true);
        nodes.set(node.id, {x:left+w/2, y:top+h/2, w, h, band, gutter:left-18});
        top += h + 12;
        for (const child of children.get(node.id)) place(child, depth + 1);
      }
      place(main, 0);
      top += 24;
      continue;
    }

    function tree(node) {
      const kids = children.get(node.id).map(tree);
      return {node, kids, depth:1 + Math.max(0, ...kids.map(k => k.depth)),
        leaves:kids.length ? kids.reduce((sum, k) => sum + k.leaves, 0) : 1};
    }
    const sides = [[], []], loads = [0, 0], depths = [0, 0];
    for (const branch of children.get(main.id).map(tree)) {
      const preferred = branch.node.lane === 'left' ? 0 : 1;
      let side = loads[preferred] <= loads[1-preferred] ? preferred : 1-preferred;
      // Deep branches can share columns vertically instead of squeezing every label.
      const columns = depths.map((depth, i) => Math.max(depth, branch.depth) + depths[1-i]);
      if (columns[side] > 4 && columns[1-side] < columns[side]) side = 1-side;
      sides[side].push(branch);
      loads[side] += branch.leaves;
      depths[side] = Math.max(depths[side], branch.depth);
    }
    const step = Math.min(216, (width - 196) / Math.max(2, depths[0] + depths[1]));
    const center = width/2 + (depths[0]-depths[1])*step/2;
    const gap = 12;
    const stackHeight = items => items.reduce((sum, b) => sum + b.span, 0) + Math.max(0, items.length-1)*gap;
    function measure(b) {
      b.kids.forEach(measure);
      b.w = Math.min(step - 30, Math.max(125, Math.ceil(labelWidth(b.node.title, false)) + 39));
      b.h = boxHeight(b.node.title, b.w, false);
      b.span = Math.max(b.h, stackHeight(b.kids));
    }
    sides.flat().forEach(measure);
    const root = {node:main, kids:[]};
    measure(root);
    const bandHeight = Math.max(root.h, ...sides.map(stackHeight));
    const y = top + bandHeight/2;
    const bounds = {band, bandTop:top, bandBottom:top+bandHeight, columnWidth:step-30};
    nodes.set(main.id, {x:center, y, w:root.w, h:root.h, ...bounds});
    function placeStack(items, x, middle, dx) {
      let at = middle - stackHeight(items)/2;
      for (const b of items) {
        const cy = at + b.span/2;
        nodes.set(b.node.id, {x, y:cy, w:b.w, h:b.h, ...bounds});
        placeStack(b.kids, x+dx, cy, dx);
        at += b.span + gap;
      }
    }
    sides.forEach((branches, i) => {
      const dx = i ? step : -step;
      placeStack(branches, center+dx, y, dx);
    });
    top += bandHeight + 54;
  }
  const edges = map.nodes.filter(n => n.parent).map(node => {
    const a = nodes.get(node.parent), b = nodes.get(node.id);
    const kind = node.lane === 'center' ? 'main' : 'branch';
    const gutter = kind === 'main' ? 9 : a.gutter;
    const d = compact
      ? `M${a.x-a.w/2} ${a.y} H${gutter+5} C${gutter} ${a.y} ${gutter} ${a.y} ${gutter} ${a.y+5} V${b.y-5} C${gutter} ${b.y} ${gutter} ${b.y} ${gutter+5} ${b.y} H${b.x-b.w/2}`
      : drawEdge(a, b, kind, true, a.columnWidth);
    return {from:node.parent, to:node.id, kind, d};
  });
  return {width, height:top - (compact ? 12 : 24), nodes, edges};
}

export function mapLayout(map, compact = false) {
  const groups = groupTopics(map), nodes = new Map();
  if (groups.some(group => group.branches.length >= 4)) return branchedLayout(map, groups, compact);
  const width = compact ? 360 : 960;
  const bands = bandPositions(map.id, groups.length);
  const rows = compact ? bands.flat().map(x => [x]) : bands;
  let cursor = 0, top = compact ? 26 : 31;
  rows.forEach((positions, band) => {
    const sections = positions.map(desktopX => {
      const {main, branches} = groups[cursor++];
      const x = compact
        ? (desktopX === 480 && !branches.length ? 180 : desktopX > 480 ? 273 : 87)
        : desktopX;
      const w = compact ? 148 : Math.min(232, Math.max(126, Math.ceil(labelWidth(main.title,false)) + 40));
      const h = boxHeight(main.title, w, compact);
      const left = compact ? x > width/2 : positions.length === 2 ? x < width/2
        : x === width/2 ? branches[0]?.lane === 'left' : x > width/2;
      const branchLimit = positions.length === 2 ? 186 : 218;
      const branchW = compact ? 148 : Math.min(branchLimit, Math.max(134, ...branches.map(n=>Math.ceil(labelWidth(n.title,false))+40)));
      const branchX = compact ? (left ? 87 : 273) : left ? 16 + branchW/2 : width - 16 - branchW/2;
      const stack = branches.map(node=>({node,h:boxHeight(node.title,branchW,compact)}));
      const gap = compact ? 9 : 8;
      const stackH = stack.reduce((sum, b)=>sum+b.h,0) + Math.max(0,stack.length-1)*gap;
      const offset = stack.length === 1 ? (band % 2 ? 13 : -13) : 0;
      return {main,x,w,h,stack,stackH,offset,branchW,branchX,gap};
    });
    const bandH = Math.max(...sections.map(s=>Math.max(s.h, s.stackH + 2*Math.abs(s.offset))));
    const y = top + bandH/2;
    const bounds = {band,bandTop:top,bandBottom:top+bandH};
    for (const s of sections) {
      nodes.set(s.main.id, {x:s.x,y,w:s.w,h:s.h,...bounds});
      let next = y - s.stackH/2 + s.offset;
      for (const b of s.stack) {
        nodes.set(b.node.id, {x:s.branchX,y:next+b.h/2,w:s.branchW,h:b.h,...bounds});
        next += b.h+s.gap;
      }
    }
    top += bandH + (compact ? 35 : 48);
  });
  const edges = map.nodes.filter(n=>n.parent).map(node=>{
    const kind = node.lane === 'center' ? 'main' : 'branch';
    return {from:node.parent,to:node.id,kind,d:drawEdge(nodes.get(node.parent),nodes.get(node.id),kind,compact)};
  });
  return {width,height:top - (compact ? 15 : 21),nodes,edges};
}
