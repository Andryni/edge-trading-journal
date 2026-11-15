import { PrismaClient } from "@prisma/client";
import { createDemoTrades, INSTRUMENTS, SETUPS } from "../packages/core/src";
const db = new PrismaClient();
async function main() {
  await db.$transaction(
    async (tx) => {
      const user = await tx.user.upsert({
        where: { email: "demo@edge.local" },
        update: {},
        create: { id: "demo-user", email: "demo@edge.local" },
      });
      for (const [id, name, provider] of [
        ["phidias", "Phidias • Évaluation", "Phidias"],
        ["tradeify", "Tradeify • Évaluation", "Tradeify"],
      ])
        await tx.account.upsert({
          where: { id },
          update: {},
          create: {
            id,
            userId: user.id,
            name,
            provider,
            initialCapital: 50000,
            profitTarget: 3000,
            maxDrawdown: 2500,
            dailyLossLimit: 1000,
            consistencyLimit: 0.3,
            highWaterMark: 50000,
          },
        });
      for (let i = 0; i < SETUPS.length; i++)
        await tx.setup.upsert({
          where: { id: `setup-${i}` },
          update: {},
          create: {
            id: `setup-${i}`,
            userId: user.id,
            name: SETUPS[i],
            entryRules:
              "Attendre une confirmation du footprint sur une zone identifiée.",
            invalidation:
              "Absence de confirmation ou dépassement du risque autorisé.",
          },
        });
      for (const t of createDemoTrades()) {
        const {
          mentalBefore,
          mentalAfter,
          energy,
          stress,
          sleep,
          confluences,
          setup,
          ...trade
        } = t;
        const spec = INSTRUMENTS[t.instrument];
        await tx.trade.upsert({
          where: { id: t.id },
          update: {
            ...trade,
            enteredAt: new Date(t.enteredAt),
            exitedAt: new Date(t.exitedAt),
          },
          create: {
            ...trade,
            enteredAt: new Date(t.enteredAt),
            exitedAt: new Date(t.exitedAt),
            ...spec,
            setupId: `setup-${SETUPS.indexOf(setup)}`,
            mentalStates: {
              create: [
                {
                  phase: "BEFORE",
                  emotion: mentalBefore,
                  energy,
                  stress,
                  sleepHours: sleep,
                },
                { phase: "AFTER", emotion: mentalAfter, energy, stress },
              ],
            },
            confluences: {
              create: confluences.map((name) => ({
                confluence: {
                  connectOrCreate: {
                    where: { userId_name: { userId: user.id, name } },
                    create: { userId: user.id, name },
                  },
                },
              })),
            },
          },
        });
      }
    },
    { timeout: 60000 },
  );
  console.log(
    "Démonstration : 180 trades, 2 comptes, 3 setups. Aucune règle officielle de prop firm.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
