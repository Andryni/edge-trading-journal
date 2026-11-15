/** Archive de sources explicite : aucun .env, export de données, cache ou journal utilisateur. */
const fs=require('node:fs'),path=require('node:path');
const files=[];
function add(file){const data=fs.readFileSync(file);files.push({file:file.replaceAll('\\','/'),data:data.toString('base64'),encoding:'base64'});}
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(item.name.startsWith('.')||['node_modules','AGENTS.md','next-env.d.ts'].includes(item.name)||/\.(test|spec)\./.test(item.name)||item.name.endsWith('.tsbuildinfo'))continue;const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else add(file);}}
for(const file of ['package.json','package-lock.json','tsconfig.json','prisma/schema.prisma','scripts/download-fonts.mjs'])if(fs.existsSync(file))add(file);
for(const dir of ['apps/web/app','apps/web/lib','apps/web/public','packages/core/src'])walk(dir);
for(const file of fs.readdirSync('apps/web'))if(/^(package\.json|next\.config\.ts|vercel\.json|postcss\.config\..+|tsconfig\.json)$/.test(file))add('apps/web/'+file);
add('packages/core/package.json');
const payload=JSON.stringify(files);fs.writeFileSync('scripts/.generated-vercel-source.json',payload);
console.log(JSON.stringify({files:files.length,bytes:Buffer.byteLength(payload),largest:files.map(f=>({file:f.file,bytes:Buffer.from(f.data,'base64').length})).sort((a,b)=>b.bytes-a.bytes).slice(0,5)}));
