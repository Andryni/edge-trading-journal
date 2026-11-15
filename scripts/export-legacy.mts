/** Export non destructif avant le passage à Supabase. Ne journalise ni email ni mot de passe. */
import {PrismaClient} from "@prisma/client";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {journalSchema} from "../packages/core/src/index.ts";
const db=new PrismaClient();
try {
  const users=await db.user.findMany({select:{id:true,email:true,document:{select:{data:true,revision:true}}}});
  const folder=join("backups","sqlite-"+new Date().toISOString().replace(/[:.]/g,"-"));mkdirSync(folder,{recursive:true});
  const entries=users.map(user=>({legacyUserId:user.id,email:user.email.toLowerCase(),revision:user.document?.revision??0,data:user.document?journalSchema.parse(JSON.parse(user.document.data)):null}));
  writeFileSync(join(folder,"journals.json"),JSON.stringify(entries,null,2));
  console.log(JSON.stringify({backup:folder,users:entries.length,journals:entries.filter(x=>x.data).length,trades:entries.reduce((s,x)=>s+(x.data?.trades.length??0),0),modes:entries.map(x=>x.data?.mode??"empty")}));
} finally {await db.$disconnect();}
