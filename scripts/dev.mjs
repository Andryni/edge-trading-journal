import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const port = portIndex >= 0 ? args[portIndex + 1] : "3000";
const hostIndex = args.indexOf("--host");
const host = hostIndex >= 0 ? args[hostIndex + 1] : "127.0.0.1";
const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "dev",
    fileURLToPath(new URL("../apps/web", import.meta.url)),
    "--hostname",
    host,
    "--port",
    port,
  ],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
