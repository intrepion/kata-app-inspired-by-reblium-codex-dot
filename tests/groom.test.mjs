import test from 'node:test';
import assert from 'node:assert/strict';
import {SEGMENTS,PRESETS,rng,createProject,generate,compose,applyBrush,validate,exportOBJ,History,outsideHead} from '../src/groom.js';
const clone = structuredClone;
const small = (style='sweep') => ({...createProject(style),density:200});
const near = (a,b,eps=1e-10) => assert.ok(Math.abs(a-b)<eps, `${a} != ${b}`);
const mirror = (a,b) => a.forEach((point,j)=>point.forEach((n,k)=>near(n,k===0?-b[j][k]:b[j][k])));
const edit = () => Array((SEGMENTS+1)*3).fill(0);
const farPair = () => [Array.from({length:SEGMENTS+1},(_,j)=>[1+j*.02,3+j*.02,0]),Array.from({length:SEGMENTS+1},(_,j)=>[-1-j*.02,3+j*.02,0])];

test('defaults are independent valid projects; unknown preset falls back',()=>{const a=createProject(),b=createProject();a.layers[0].offsets[0]=edit();assert.deepEqual(b,validate(b));assert.deepEqual(b.layers[0].offsets,{});assert.equal(createProject('unknown').style,'sweep');});
test('seeded random generator is deterministic and bounded',()=>{const a=rng(42),b=rng(42),c=rng(43);const xs=Array.from({length:100},()=>a());assert.deepEqual(xs,Array.from({length:100},()=>b()));assert.notDeepEqual(xs,Array.from({length:100},()=>c()));assert.ok(xs.every(n=>n>=0&&n<1));});
for(const style of Object.keys(PRESETS)) test(`${style}: finite deterministic geometry with paired surface-anchored roots`,()=>{const p=small(style),saved=clone(p),s=generate(p);assert.deepEqual(p,saved);assert.deepEqual(s,generate(p));assert.equal(s.length,p.density);for(let i=0;i<s.length;i+=2){mirror(style==='sweep'?[s[i][0]]:s[i],style==='sweep'?[s[i+1][0]]:s[i+1]);for(const strand of [s[i],s[i+1]]){assert.equal(strand.length,SEGMENTS+1);assert.ok(strand.flat().every(Number.isFinite));const [x,y,z]=strand[0];near(Math.hypot(x/.653,(y-1.38)/.858,z/.608),1);}}});
test('changing seed changes geometry while density preserves strand prefix',()=>{const p=small();assert.notDeepEqual(generate(p),generate({...p,seed:p.seed+1}));assert.deepEqual(generate({...p,density:400}).slice(0,200),generate(p));});
test('collision projects an interior point to the head shell',()=>{const q=outsideHead([.1,1.5,.1]);near(Math.hypot(q[0]/.653,(q[1]-1.38)/.858,q[2]/.608),1);assert.deepEqual(outsideHead([3,3,3]),[3,3,3]);});
test('composition is detached, additive, visibility-controlled, and never edits roots',()=>{const p=small(),base=farPair(),before=clone(base),a=edit(),b=edit();a[0]=2;a[3]=.1;b[3]=.2;p.layers[0].offsets[0]=a;p.layers.push({id:2,name:'Second',visible:true,offsets:{0:b}});let s=compose(p,base);near(s[0][1][0],base[0][1][0]+.3);assert.deepEqual(s[0][0],base[0][0]);assert.deepEqual(base,before);p.layers[1].visible=false;s=compose(p,base);near(s[0][1][0],base[0][1][0]+.1);s[1][0][0]=100;assert.deepEqual(base,before);});
test('brush writes active layer only, preserves base/current, and honors root lock',()=>{const p=small(),base=farPair(),saved=clone(base);p.layers.push({id:2,name:'Second',visible:true,offsets:{}});p.activeLayer=2;assert.equal(applyBrush(p,base,[{index:0,weight:1}],{delta:[.2,.1,0],lock:.5}),1);assert.deepEqual(p.layers[0].offsets,{});assert.deepEqual(base,saved);const s=compose(p,base);for(let j=0;j<=SEGMENTS/2;j++)assert.deepEqual(s[0][j],base[0][j]);assert.ok(s[0].at(-1)[0]>base[0].at(-1)[0]);assert.deepEqual(s[1],base[1]);});
test('hidden or missing active layer cannot be groomed',()=>{const p=small(),base=farPair();p.layers[0].visible=false;assert.equal(applyBrush(p,base,[{index:0,weight:1}],{delta:[1,0,0]}),0);p.activeLayer=404;assert.equal(applyBrush(p,base,[{index:0,weight:1}],{}),0);assert.deepEqual(p.layers[0].offsets,{});});
test('one-sided mirrored strokes preserve exact reflection',()=>{for(const index of [0,1]){const p=small(),base=farPair();applyBrush(p,base,[{index,weight:.8}],{delta:[.2,.1,.1],symmetry:true});const s=compose(p,base);mirror(s[0],s[1]);}});
test('overlapping mirrored hits preserve reflection with unequal weights',()=>{const p=small(),base=farPair();applyBrush(p,base,[{index:0,weight:1},{index:1,weight:.2}],{delta:[.2,.1,.1],symmetry:true});const s=compose(p,base);mirror(s[0],s[1]);});
test('length grows/shortens tips and keeps roots anchored',()=>{for(const scale of [.8,1.2]){const p=small(),base=farPair();applyBrush(p,base,[{index:0,weight:1}],{tool:'length',scale,strength:1,lock:0});const s=compose(p,base);assert.deepEqual(s[0][0],base[0][0]);const distance=strand=>Math.hypot(...strand.at(-1).map((n,k)=>n-strand[0][k]));assert.equal(distance(s[0])>distance(base[0]),scale>1);}});
test('smoothing damps an interior spike without moving endpoints',()=>{const p=small(),base=farPair();base[0][10][2]=1;applyBrush(p,base,[{index:0,weight:1}],{tool:'smooth',strength:1,lock:0});const s=compose(p,base);assert.ok(s[0][10][2]<1);assert.deepEqual(s[0][0],base[0][0]);assert.deepEqual(s[0].at(-1),base[0].at(-1));});
test('large edits stay finite, bounded, and valid through JSON round trip',()=>{const p=small(),base=farPair();applyBrush(p,base,[{index:0,weight:1}],{delta:[1000,1000,1000],strength:1});assert.ok(p.layers[0].offsets[0].every(n=>Number.isFinite(n)&&Math.abs(n)<=3));assert.deepEqual(validate(JSON.parse(JSON.stringify(p))),p);});
test('project validation rejects bad version, style, colors, limits and non-finite values',()=>{for(const patch of [{format:'other'},{version:2},{style:'bad'},{style:'toString'},{style:'__proto__'},{style:'constructor'},{root:'#fff'},{tip:'red'},{density:201},{density:200.5},{density:1802},{seed:1.5},{seed:0},{length:NaN},{curl:Infinity},{volume:-1},{width:.1}])assert.throws(()=>validate({...small(),...patch}),undefined,JSON.stringify(patch));for(const input of [null,[],{},'text'])assert.throws(()=>validate(input));});
test('all numeric boundary values round-trip',()=>{for(const patch of [{seed:1,density:200,length:.15,curl:0,volume:0,width:.001},{seed:999999,density:1800,length:1.8,curl:1,volume:.65,width:.008}]){const p={...small(),...patch};assert.deepEqual(validate(p),p);}});
test('validation detaches edit arrays, truncates labels, and repairs absent active layer',()=>{const p=small();p.name='a'.repeat(100);p.layers[0].name='b'.repeat(100);p.layers[0].offsets[0]=edit();p.activeLayer=100;const v=validate(p);assert.equal(v.name.length,60);assert.equal(v.layers[0].name.length,40);assert.equal(v.activeLayer,1);v.layers[0].offsets[0][3]=1;assert.equal(p.layers[0].offsets[0][3],0);});
test('validation rejects malformed layers and strand offsets',()=>{const variants=[[],Array(9).fill({id:1}),[null],[{...small().layers[0],visible:1}],[{...small().layers[0],id:0}],[small().layers[0],small().layers[0]]];for(const layers of variants)assert.throws(()=>validate({...small(),layers}));for(const [key,value] of [['200',edit()],['-1',edit()],['00',edit()],['01',edit()],['x',edit()],['0',[0]],['0',edit().map((n,i)=>i===3?NaN:n)],['0',edit().map((n,i)=>i===3?4:n)],['0',edit().map((n,i)=>i===0?1:n)]]){const p=small();p.layers[0].offsets[key]=value;assert.throws(()=>validate(p));}});
test('OBJ exports composed vertices with contiguous valid polyline indices',()=>{const p=small(),base=farPair();applyBrush(p,base,[{index:0,weight:1}],{delta:[.1,0,0]});const strands=compose(p,base),obj=exportOBJ(p,strands),lines=obj.trim().split('\n'),vertices=lines.filter(l=>l.startsWith('v ')),curves=lines.filter(l=>l.startsWith('l '));assert.equal(vertices.length,2*(SEGMENTS+1));assert.equal(curves.length,2);assert.ok(!obj.includes('NaN'));for(let i=0;i<2;i++)assert.deepEqual(curves[i].split(' ').slice(1).map(Number),Array.from({length:SEGMENTS+1},(_,j)=>i*(SEGMENTS+1)+j+1));const tip=vertices[SEGMENTS].split(' ').slice(1).map(Number);tip.forEach((n,k)=>near(n,strands[0][SEGMENTS][k],1e-6));assert.match(obj,/Hair only/);});
test('OBJ default includes visible edits and omits hidden edits',()=>{const p=small(),a=exportOBJ(p);applyBrush(p,compose(p),[{index:0,weight:1}],{delta:[.3,.3,0]});assert.notEqual(exportOBJ(p),a);p.layers[0].visible=false;assert.equal(exportOBJ(p),a);});
test('history returns detached snapshots and supports undo/redo across full project changes',()=>{const h=new History(),a=small(),b=small('coils');h.push(a);a.name='mutated';const restored=h.undo(b);assert.equal(restored.name,'Untitled groom');assert.deepEqual(h.redo(restored),b);assert.deepEqual(h.undo(b),restored);});
test('history is bounded, no-ops at ends, and clears redo after branching',()=>{const h=new History(2),p=small();assert.equal(h.undo(p),p);assert.equal(h.redo(p),p);for(let i=0;i<3;i++)h.push({...p,name:String(i)});assert.equal(h.past.length,2);let state=h.undo({...p,name:'3'});assert.equal(state.name,'2');state=h.undo(state);assert.equal(state.name,'1');assert.equal(h.undo(state),state);h.push({...p,name:'branch'});assert.equal(h.future.length,0);assert.equal(h.redo(state),state);});

test('inherited preset names fall back safely during project creation',()=>{for(const style of ['toString','__proto__','constructor'])assert.deepEqual(createProject(style),createProject('sweep'));});

test('repeated mixed strokes remain finite and serializable at maximum shape settings',()=>{for(const style of Object.keys(PRESETS)){const p={...small(style),length:1.8,curl:1,volume:.65},base=generate(p),roots=base.map(s=>s[0]);for(let i=0;i<12;i++)applyBrush(p,compose(p,base),Array.from({length:200},(_,index)=>({index,weight:1})),{tool:['comb','smooth','length'][i%3],delta:[.4,-.2,.3],scale:.8,strength:1,symmetry:true});assert.deepEqual(validate(p),p);const s=compose(p,base);assert.ok(s.flat(2).every(Number.isFinite));assert.deepEqual(s.map(s=>s[0]),roots);}});

for (const style of Object.keys(PRESETS)) {
  test(`${style}: volume changes geometry without moving roots`, () => {
    const p = small(style);
    const low = generate({...p, volume: 0});
    const high = generate({...p, volume: .65});
    assert.notDeepEqual(low, high);
    assert.deepEqual(low.map(s => s[0]), high.map(s => s[0]));
    const difference = high.reduce((sum, strand, i) => sum + strand.reduce((total, point, j) => total + Math.hypot(...point.map((n, k) => n - low[i][j][k])), 0), 0);
    assert.ok(difference > 1, 'Volume must produce a meaningful geometry change');
    assert.ok(high.flat(2).every(Number.isFinite));
  });
}

test('mirrored overlap is independent of hit ordering and follows stronger side', () => {
  const hits = [{index: 0, weight: .2}, {index: 1, weight: 1}];
  const a = small(), b = small(), base = farPair();
  const options = {delta: [.2, .1, .1], symmetry: true};
  applyBrush(a, base, hits, options);
  applyBrush(b, base, hits.toReversed(), options);
  assert.deepEqual(a.layers, b.layers);
  const strands = compose(a, base);
  mirror(strands[0], strands[1]);
  assert.ok(strands[1].at(-1)[0] > base[1].at(-1)[0]);
});

for (const options of [{tool: 'comb', delta: [0, 0, 0]}, {tool: 'length', scale: 1}]) {
  test(`${options.tool}: no-op stroke leaves layers untouched and reports no changes`, () => {
    const p = small();
    const base = farPair();
    const before = clone(p);
    assert.equal(applyBrush(p, base, [{index: 0, weight: 1}], {...options, symmetry: true}), 0);
    assert.deepEqual(p, before);

    applyBrush(p, base, [{index: 0, weight: 1}], {delta: [.2, .1, .1]});
    const edited = clone(p);
    const offsets = p.layers[0].offsets[0];
    assert.equal(applyBrush(p, compose(p, base), [{index: 0, weight: 1}], options), 0);
    assert.deepEqual(p, edited);
    assert.equal(p.layers[0].offsets[0], offsets, 'Existing offset array must not be replaced by no-op edits');
  });
}
