import { copyFileSync, existsSync, openSync, closeSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
if (!existsSync(".env")) copyFileSync(".env.example", ".env");
if (!existsSync("prisma/dev.db")) closeSync(openSync("prisma/dev.db", "a"));
for (const args of [["generate"], ["migrate", "deploy"]]) {
  const p = spawnSync(
    process.execPath,
    [require.resolve("prisma/build/index.js"), ...args],
    { stdio: "inherit" },
  );
  if (p.status) process.exit(p.status ?? 1);
}
console.log("EDGE prêt. Lance npm run dev, puis ouvre http://localhost:3000.");
