// Original strand model. Coordinates are arbitrary studio units, Y up, +Z front.
export const SEGMENTS=22;
export const PRESETS={sweep:{name:'Side sweep',length:.55,curl:.12,volume:.22},bob:{name:'Soft bob',length:1.25,curl:.08,volume:.12},coils:{name:'Cloud coils',length:.72,curl:.85,volume:.48},crest:{name:'High crest',length:.8,curl:.05,volume:.36}};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function createProject(style='sweep'){const known=Object.hasOwn(PRESETS,style),s=known?PRESETS[style]:PRESETS.sweep;return {format:'strandloom',version:1,name:'Untitled groom',style:known?style:'sweep',seed:48,density:800,length:s.length,curl:s.curl,volume:s.volume,root:'#342827',tip:'#b98a62',width:.0035,layers:[{id:1,name:'Finishing strokes',visible:true,offsets:{}}],activeLayer:1};}
export function outsideHead(p){let q=[p[0]/.653,(p[1]-1.38)/.858,p[2]/.608];let n=Math.hypot(...q);if(n<1&&p[1]>.55){let f=1/Math.max(n,.001);return[q[0]*f*.653,q[1]*f*.858+1.38,q[2]*f*.608];}return p;}
export function generate(p){const r=rng(p.seed),strands=[];for(let i=0;i<p.density/2;i++){
 const theta=r()*Math.PI,front=Math.cos(theta),maxPhi=front>0?1.1+(1-front)*.55:1.65-front*.23;
 const phi=Math.acos(1-r()*(1-Math.cos(maxPhi))),phase=r()*Math.PI*2,noise=r();
 for(const sign of [1,-1]){const root=[sign*.653*Math.sin(phi)*Math.sin(theta),1.38+.858*Math.cos(phi),.608*Math.sin(phi)*Math.cos(theta)],points=[];
 for(let j=0;j<=SEGMENTS;j++){let t=j/SEGMENTS,len=p.length*(.9+noise*.2),x=root[0],y=root[1],z=root[2],normal=[sign*Math.sin(phi)*Math.sin(theta),Math.cos(phi),Math.sin(phi)*Math.cos(theta)];
 if(p.style==='bob'){let q=phi+t*len,angle=theta+(front>.15?.48:0)*t,rr=Math.sin(Math.min(q,1.57));x=sign*Math.sin(angle)*(.66*rr+p.volume*.35*Math.sin(t*Math.PI));z=Math.cos(angle)*(.62*rr+p.volume*.22*Math.sin(t*Math.PI));y=1.38+.858*Math.cos(q);}
 else if(p.style==='coils'){let spread=.3+p.volume*.75;x+=normal[0]*len*t*spread;y+=normal[1]*len*t*(spread+.1)-t*t*.08;z+=normal[2]*len*t*spread;}
 else if(p.style==='crest'){x*=1-t*.45;y+=len*t*(.12+p.volume*.45+.7*Math.cos(phi));z-=len*t*.35;}
 else {let top=Math.pow(Math.max(0,Math.cos(phi)),1.2),d=[.85*top,-.6*(1-top),-.5*top],dot=d.reduce((a,v,k)=>a+v*normal[k],0),lift=(.025+p.volume*.35)*Math.sin(t*Math.PI),localLength=len*(.35+.65*top);x+=(d[0]-dot*normal[0])*localLength*t+normal[0]*lift;y+=(d[1]-dot*normal[1])*localLength*t+normal[1]*lift-localLength*t*t*.15;z+=(d[2]-dot*normal[2])*localLength*t+normal[2]*lift;}
 const wave=Math.sin(t*Math.PI*2*(p.style==='coils'?5:1.4)+phase)-Math.sin(phase),amp=p.curl*.075*t;
 x+=sign*wave*amp;y+=Math.cos(t*Math.PI*10+phase)*amp*.5;z+=Math.cos(t*Math.PI*2*(p.style==='coils'?5:1.4)+phase)*amp;
 points.push(j===0?root.slice():outsideHead([x,y,z]));}strands.push(points);}}
 return strands;}
export function compose(p,base=generate(p)){return base.map((strand,i)=>strand.map((pt,j)=>{if(!j)return pt.slice();let v=pt.slice();for(const l of p.layers)if(l.visible&&l.offsets[i])for(let k=0;k<3;k++)v[k]+=l.offsets[i][j*3+k]||0;return outsideHead(v);}));}
export function applyBrush(p,current,hits,{tool='comb',delta=[0,0,0],strength=.5,lock=.15,symmetry=false,scale=1}){
 const l=p.layers.find(x=>x.id===p.activeLayer);if(!l||!l.visible)return 0;let changed=0;const weights=new Map(hits.map(h=>[h.index,h.weight])),mirrored=new Set();if(symmetry){const pairs=new Set(hits.map(h=>h.index&~1));for(const even of pairs){const odd=even+1,ew=weights.get(even)||0,ow=weights.get(odd)||0,source=ew>=ow?even:odd,w=Math.max(ew,ow);weights.set(even,w);weights.set(odd,w);mirrored.add(source^1);}}
 for(const [index,w] of weights){if(!current[index])continue;const s=current[index],off=(l.offsets[index]||Array((SEGMENTS+1)*3).fill(0)).slice();let strandChanged=false;for(let j=1;j<=SEGMENTS;j++){let t=j/SEGMENTS;if(t<=lock)continue;let f=(t-lock)/(1-lock)*w*strength,v=s[j].slice();if(tool==='comb'){for(let k=0;k<3;k++)v[k]+=delta[k]*f*(mirrored.has(index)&&k===0?-1:1);}
 else if(tool==='length'){for(let k=0;k<3;k++)v[k]+=(s[j][k]-s[0][k])*(scale-1)*f;}
 else if(tool==='smooth'&&j<SEGMENTS){for(let k=0;k<3;k++)v[k]+=(s[j-1][k]+s[j+1][k]-2*s[j][k])*.5*f;}
 v=outsideHead(v);for(let k=0;k<3;k++){let next=clamp(off[j*3+k]+v[k]-s[j][k],-3,3);if(Math.abs(next-off[j*3+k])>1e-9){off[j*3+k]=next;strandChanged=true;}}}
 if(strandChanged){l.offsets[index]=off;changed++;}}return changed;}
export function validate(raw){if(!raw||raw.format!=='strandloom'||raw.version!==1)throw Error('Choose a Strandloom v1 project.');
 const p=createProject(raw.style);if(!Object.hasOwn(PRESETS,raw.style))throw Error('Unknown hairstyle.');p.style=raw.style;p.name=String(raw.name||'Untitled groom').slice(0,60);
 for(const [key,min,max] of [['seed',1,999999],['density',200,1800],['length',.15,1.8],['curl',0,1],['volume',0,.65],['width',.001,.008]]){if(typeof raw[key]!=='number'||!Number.isFinite(raw[key])||raw[key]<min||raw[key]>max)throw Error(`Invalid ${key}.`);p[key]=raw[key];}
 if(!Number.isInteger(p.density)||p.density%2||!Number.isInteger(p.seed))throw Error('Invalid strand count or seed.');
 for(const key of ['root','tip']){if(!/^#[0-9a-f]{6}$/i.test(raw[key]))throw Error('Invalid hair color.');p[key]=raw[key];}
 if(!Array.isArray(raw.layers)||raw.layers.length<1||raw.layers.length>8)throw Error('Use 1–8 groom layers.');const ids=new Set();
 p.layers=raw.layers.map(l=>{if(!Number.isSafeInteger(l.id)||l.id<1||ids.has(l.id)||typeof l.visible!=='boolean'||!l.offsets||Array.isArray(l.offsets)||typeof l.offsets!=='object')throw Error('Invalid groom layer.');ids.add(l.id);let offsets={};for(const [key,v] of Object.entries(l.offsets)){if(!/^(0|[1-9]\d*)$/.test(key)||+key>=p.density||!Array.isArray(v)||v.length!==(SEGMENTS+1)*3||v.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>3)||v.slice(0,3).some(n=>n!==0))throw Error('Invalid strand edit.');offsets[key]=v.slice();}return{id:l.id,name:String(l.name||'Groom layer').slice(0,40),visible:l.visible,offsets};});
 p.activeLayer=ids.has(raw.activeLayer)?raw.activeLayer:p.layers[0].id;return p;}
export function exportOBJ(p,strands=compose(p)){let out=['# Kata Strandloom v1: untextured 3D polylines, Y up, arbitrary units','# Hair only. Import as curves/edges; not a mesh or Alembic groom.','o Strandloom_Hair'],idx=1;for(const s of strands){for(const v of s)out.push('v '+v.map(n=>n.toFixed(6)).join(' '));out.push('l '+s.map((_,i)=>idx+i).join(' '));idx+=s.length;}return out.join('\n')+'\n';}
export class History {constructor(limit=24){this.limit=limit;this.past=[];this.future=[];}push(p){this.past.push(JSON.stringify(p));if(this.past.length>this.limit)this.past.shift();this.future=[];}undo(p){if(!this.past.length)return p;this.future.push(JSON.stringify(p));return JSON.parse(this.past.pop());}redo(p){if(!this.future.length)return p;this.past.push(JSON.stringify(p));return JSON.parse(this.future.pop());}}
