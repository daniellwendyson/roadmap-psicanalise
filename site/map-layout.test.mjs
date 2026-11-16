import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import test from 'node:test';
import {mapLayout} from './dist/map-layout.js';

const directory = new URL('./dist/data/',import.meta.url);
const maps = readdirSync(directory).map(file=>JSON.parse(readFileSync(new URL(file,directory))));

// Sample the same SVG segments that will be drawn by the browser.
function samplePath(d) {
  const commands = d.match(/[MHVC][^MHVC]*/g);
  const points = [];
  let x, y;
  for (const command of commands) {
    const a = command.slice(1).trim().split(/\s+/).map(Number);
    const op = command[0];
    if (op === 'M') { [x,y] = a; points.push([x,y]); continue; }
    const startX = x, startY = y;
    for (let i=1; i<=64; i++) {
      const t=i/64, u=1-t;
      if(op==='C'){
        x=u**3*startX + 3*u*u*t*a[0] + 3*u*t*t*a[2] + t**3*a[4];
        y=u**3*startY + 3*u*u*t*a[1] + 3*u*t*t*a[3] + t**3*a[5];
      }else if(op==='H') x=startX+ t*(a[0]-startX);
      else if(op==='V') y=startY+ t*(a[0]-startY);
      else assert.fail('Comando SVG inesperado '+op);
      points.push([x,y]);
    }
  }
  return points;
}

for (const map of maps) {
  for (const compact of [false,true]) {
    test(map.id+' · geometria '+(compact?'compacta':'ampla'),()=>{
      const {width,height,nodes,edges}=mapLayout(map,compact);
      assert.equal(nodes.size,map.nodes.length);
      assert.equal(edges.length,nodes.size-1);
      if(!compact){
        const forks = map.nodes.filter(n=>n.lane !== 'center' && map.nodes.filter(child=>child.parent===n.id).length>=2);
        assert.ok(forks.length>=2, 'Ramificações precisam ter subtópicos próprios');
        for(const n of forks){
          for(const child of map.nodes.filter(c=>c.parent===n.id)) {
            assert.notEqual(nodes.get(n.id).x,nodes.get(child.id).x, n.id+' deve se abrir lateralmente');
          }
        }
      }
      for (const [id,n] of nodes) {
        assert.ok(n.x-n.w/2>=0 && n.x+n.w/2<=width && n.y-n.h/2>=0 && n.y+n.h/2<=height,id);
        for (const [id2,n2] of nodes) {
          if(id2===id)continue;
          assert.ok(Math.abs(n.x-n2.x)>=(n.w+n2.w)/2+4 || Math.abs(n.y-n2.y)>=(n.h+n2.h)/2+4,
            id+' encosta em '+id2);
        }
      }
      for (const e of edges) {
        assert.equal(map.nodes.find(n=>n.id===e.to).parent,e.from);
        const points=samplePath(e.d);
        for (const [id,n] of nodes) {
          if(id===e.from||id===e.to)continue;
          assert.ok(points.every(([x,y])=>Math.abs(x-n.x)>=n.w/2+1 || Math.abs(y-n.y)>=n.h/2+1),
            e.from+' → '+e.to+' atravessa '+id);
        }
      }
    });
  }
}
