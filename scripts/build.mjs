import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const f of ['index.html','styles.css','favicon.svg','app.json','LICENSE'])await copyFile(f,'dist/'+f);
for(const d of ['src','vendor','docs/screenshots'])await cp(d,'dist/'+d,{recursive:true});
console.log('Built static app in dist. No network or build dependencies.');
