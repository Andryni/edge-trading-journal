/** Vérification sur une base SQLite temporaire : aucune donnée utilisateur touchée. */
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  closeSync,
  openSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const folder = mkdtempSync(join(tmpdir(), "edge-integration-"));
const file = join(folder, "test.db");
closeSync(openSync(file, "a"));
process.env.DATABASE_URL = `file:${file}`;
const { db } = await import("../apps/web/lib/db.ts");
const { saveJournal } = await import("../apps/web/lib/repository.ts");
const { newJournal } = await import("../packages/core/src/index.ts");
try {
  for (const dir of readdirSync("prisma/migrations")
    .filter((d) => !d.includes("."))
    .sort()) {
    const sql = readFileSync(
      join("prisma/migrations", dir, "migration.sql"),
      "utf8",
    );
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await db.$executeRawUnsafe(statement);
  }
  const alice = await db.user.create({
    data: { email: "alice-test@edge.local" },
  });
  const bob = await db.user.create({ data: { email: "bob-test@edge.local" } });
  const a = newJournal(true);
  const saved = await saveJournal(alice.id, 0, a);
  assert.equal(saved.revision, 1);
  assert.equal(
    await db.trade.count({ where: { account: { userId: alice.id } } }),
    180,
  );
  assert.equal(await db.screenshot.count(), 0);
  assert.equal(await db.account.count({ where: { userId: bob.id } }), 0);
  await assert.rejects(() => saveJournal(alice.id, 0, a), /CONFLICT/);
  assert.equal(
    (await db.journalDocument.findUnique({ where: { userId: alice.id } }))
      ?.revision,
    1,
  );
  a.trades[0].notes = "Test de modification";
  a.trades[0].mentalBefore = "Concentré";
  a.trades[0].screenshots = [
    {
      id: "image",
      phase: "Avant",
      data: "data:image/png;base64,aGVsbG8=",
      annotations: "[]",
    },
  ];
  a.plans.push({
    date: "2026-11-13",
    checks: [true, true, true, true, true, true],
    levels: "POC",
    optionLevels: "call wall",
    volumeZones: "HVN",
    events: "Aucune",
    mental: "Calme",
    maxTrades: 3,
    allowedSetups: [a.setups[0].name],
    validatedAt: new Date().toISOString(),
  });
  a.reviews.push({
    date: "2026-11-13",
    planScore: 9,
    bestTradeId: a.trades[0].id,
    worstMistake: "Timing",
    tomorrowAction: "Attendre la confirmation",
  });
  a.goals.push({
    id: "goal",
    label: "Discipline",
    unit: "DISCIPLINE",
    target: 90,
    startsAt: "2026-11-01T00:00:00Z",
    endsAt: "2026-11-30T23:59:59Z",
  });
  await saveJournal(alice.id, 1, a);
  assert.equal(await db.screenshot.count(), 1);
  assert.equal(await db.sessionPlan.count(), 1);
  assert.equal(await db.goal.count(), 1);
  assert.equal(
    (
      await db.trade.findUnique({
        where: { id: alice.id + ":" + a.trades[0].id },
      })
    )?.notes,
    "Test de modification",
  );
  a.trades = a.trades.slice(1);
  await saveJournal(alice.id, 2, a);
  assert.equal(
    await db.trade.count({ where: { account: { userId: alice.id } } }),
    179,
  );
  assert.equal(await db.screenshot.count(), 0);
  await saveJournal(bob.id, 0, newJournal());
  assert.equal(
    await db.trade.count({ where: { account: { userId: bob.id } } }),
    0,
  );
  assert.equal(await db.account.count({ where: { userId: bob.id } }), 1);
  console.log(
    "SQLite : création, modification, capture, routines, objectif, suppression réversible via backup, isolation et conflit de révision vérifiés.",
  );
} finally {
  await db.$disconnect();
  rmSync(folder, { recursive: true, force: true });
}
