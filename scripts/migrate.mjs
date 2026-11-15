import { existsSync, closeSync, openSync } from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
// Précrée le fichier pour éviter l'erreur générique du moteur si SQLite n'existe pas.
if (!existsSync("prisma/dev.db")) closeSync(openSync("prisma/dev.db", "a"));
const result = spawnSync(
  process.execPath,
  [
    require.resolve("prisma/build/index.js"),
    "migrate",
    "dev",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
