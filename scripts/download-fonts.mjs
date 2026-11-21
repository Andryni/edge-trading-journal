/** Héberge les polices avec le site : aucune requête Google Fonts lors de son utilisation. */
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const folder=new URL('../apps/web/public/fonts/',import.meta.url);await mkdir(folder,{recursive:true});
const source='https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&display=swap';
const response=await fetch(source,{headers:{'User-Agent':'Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36'},signal:AbortSignal.timeout(20000)});
if(!response.ok)throw new Error('Font stylesheet download failed: '+response.status);
let css=await response.text();const urls=[...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))];
if(!urls.length)throw new Error('No font files in stylesheet.');
await Promise.all(urls.map(async url=>{const name='edge-'+createHash('sha256').update(url).digest('hex').slice(0,16)+'.woff2';const file=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!file.ok)throw new Error('Font download failed.');await writeFile(new URL(name,folder),new Uint8Array(await file.arrayBuffer()));css=css.replaceAll(url,'/fonts/'+name);}));
await writeFile(new URL('edge.css',folder),css);console.log('Self-hosted EDGE fonts: '+urls.length+' files.');
