import { Prisma } from "@prisma/client";
import { db } from "./db";
import { journalSchema, type Journal } from "@edge/core";
const idFor = (userId: string, id: string) => `${userId}:${id}`;
/** Document versionné + tables normalisées : une seule transaction, jamais de mise à jour partielle. */
export async function saveJournal(
  userId: string,
  expected: number,
  input: unknown,
) {
  const journal = journalSchema.parse(input);
  await db.$transaction(
    async (tx) => {
      const current = await tx.journalDocument.findUnique({
        where: { userId },
      });
      if ((current?.revision ?? 0) !== expected) throw new Error("CONFLICT");
      const previous = current
        ? journalSchema.parse(JSON.parse(current.data))
        : null;
      if (current) {
        const result = await tx.journalDocument.updateMany({
          where: { userId, revision: expected },
          data: { data: JSON.stringify(journal), revision: { increment: 1 } },
        });
        if (!result.count) throw new Error("CONFLICT");
      } else
        await tx.journalDocument.create({
          data: { userId, data: JSON.stringify(journal), revision: 1 },
        });
      const key = (id: string) => idFor(userId, id);
      const prevTrades = new Map(previous?.trades.map((t) => [t.id, t]) ?? []);
      const setupIds = new Map<string, string>();
      for (const a of journal.accounts) {
        const data = {
          userId,
          name: a.name,
          provider: a.provider,
          initialCapital: a.initialCapital,
          profitTarget: a.profitTarget,
          drawdownMode: a.drawdownMode,
          maxDrawdown: a.maxDrawdown,
          dailyLossLimit: a.dailyLossLimit,
          consistencyLimit: a.consistencyLimit,
          minTradingDays: a.minTradingDays,
          maxContracts: a.maxContracts,
          market: a.market ?? null,
          highWaterMark: a.highWaterMark,
        };
        await tx.account.upsert({
          where: { id: key(a.id) },
          create: { id: key(a.id), ...data },
          update: data,
        });
      }
      const activeSetups = new Set(journal.setups.map((setup) => setup.id));
      const removedSetupIds = previous?.setups.filter((setup) => !activeSetups.has(setup.id)).map((setup) => key(setup.id)) ?? [];
      if (removedSetupIds.length) {
        await tx.setup.deleteMany({ where: { userId, id: { in: removedSetupIds } } });
      }
      for (const s of journal.setups) {
        setupIds.set(s.name, key(s.id));
        if (!previous?.setups.some((setup) => setup.id === s.id)) {
          await tx.setup.updateMany({ where: { userId, name: s.name, id: { not: key(s.id) } }, data: { id: key(s.id) } });
        }
        await tx.setup.upsert({
          where: { id: key(s.id) },
          create: {
            id: key(s.id),
            userId,
            name: s.name,
            entryRules: s.entryRules,
            invalidation: s.invalidation,
          },
          update: {
            name: s.name,
            entryRules: s.entryRules,
            invalidation: s.invalidation,
          },
        });
      }
      for (const t of journal.trades) {
        if (!setupIds.has(t.setup)) {
          const setup = await tx.setup.upsert({
            where: { userId_name: { userId, name: t.setup } },
            create: { userId, name: t.setup },
            update: {},
          });
          setupIds.set(t.setup, setup.id);
        }
      }
      await tx.trade.deleteMany({
        where: {
          account: { userId },
          id: { notIn: journal.trades.map((t) => key(t.id)) },
        },
      });
      for (const t of journal.trades) {
        if (
          previous &&
          JSON.stringify(prevTrades.get(t.id)) === JSON.stringify(t) &&
          !previous.setups.some((setup) => setup.name === t.setup && !activeSetups.has(setup.id))
        )
          continue;
        const spec = journal.settings.instruments[t.instrument];
        const data = {
          accountId: key(t.accountId),
          setupId: setupIds.get(t.setup),
          enteredAt: new Date(t.enteredAt),
          exitedAt: new Date(t.exitedAt),
          instrument: t.instrument,
          direction: t.direction,
          entry: t.entry,
          stop: t.stop,
          target: t.target,
          exit: t.exit,
          quantity: t.quantity,
          fees: t.fees,
          tickSize: t.tickSize ?? spec?.tickSize ?? 1,
          tickValue: t.tickValue ?? spec?.tickValue ?? 1,
          session: t.session,
          timeframe: t.timeframe,
          quality: t.quality,
          planScore: t.planScore ?? -1, // -1 = non renseign? dans le miroir SQLite historique ; le JSON conserve null.
          notes: t.notes,
          didWell: t.didWell ?? "",
          didWrong: t.didWrong ?? "",
          lesson: t.lesson ?? "",
          mfeR: t.mfeR ?? null,
          maeR: t.maeR ?? null,
          sourceKey: t.sourceKey ?? null,
        };
        const mental = t.energy !== null && t.stress !== null && t.sleep !== null ? [
          {
            phase: "BEFORE",
            emotion: t.mentalBefore,
            energy: t.energy,
            stress: t.stress,
            sleepHours: t.sleep,
          },
          {
            phase: "AFTER",
            emotion: t.mentalAfter,
            energy: t.energy,
            stress: t.stress,
            sleepHours: t.sleep,
          },
        ] as {phase: string; emotion: string; energy: number; stress: number; sleepHours: number}[] : [];
        const screens = (t.screenshots ?? []).map((s) => ({
          phase: s.phase,
          localPath: s.data,
          annotationsJson: s.annotations,
        }));
        const tags = (t.tags ?? []).map((label) => ({ label }));
        const exists = await tx.trade.findUnique({
          where: { id: key(t.id) },
          select: { id: true },
        });
        if (exists)
          await tx.trade.update({
            where: { id: key(t.id) },
            data: {
              ...data,
              mentalStates: { deleteMany: {}, create: mental },
              screenshots: { deleteMany: {}, create: screens },
              tags: { deleteMany: {}, create: tags },
              confluences: { deleteMany: {} },
            },
          });
        else
          await tx.trade.create({
            data: {
              id: key(t.id),
              ...data,
              mentalStates: { create: mental },
              screenshots: { create: screens },
              tags: { create: tags },
            },
          });
        for (const name of t.confluences) {
          const c = await tx.confluence.upsert({
            where: { userId_name: { userId, name } },
            create: { userId, name },
            update: {},
          });
          await tx.tradeConfluence.upsert({
            where: {
              tradeId_confluenceId: { tradeId: key(t.id), confluenceId: c.id },
            },
            create: { tradeId: key(t.id), confluenceId: c.id },
            update: {},
          });
        }
      }
      await tx.account.deleteMany({
        where: {
          userId,
          id: { notIn: journal.accounts.map((a) => key(a.id)) },
        },
      });
      for (const p of journal.plans)
        await tx.sessionPlan.upsert({
          where: { userId_localDate: { userId, localDate: p.date } },
          create: {
            userId,
            localDate: p.date,
            checklistJson: JSON.stringify(p),
            keyLevels: p.levels,
            allowedSetupsJson: JSON.stringify(p.allowedSetups),
            maxTrades: p.maxTrades,
            validatedAt: p.validatedAt ? new Date(p.validatedAt) : null,
          },
          update: {
            checklistJson: JSON.stringify(p),
            keyLevels: p.levels,
            allowedSetupsJson: JSON.stringify(p.allowedSetups),
            maxTrades: p.maxTrades,
            validatedAt: p.validatedAt ? new Date(p.validatedAt) : null,
          },
        });
      await tx.sessionPlan.deleteMany({
        where: {
          userId,
          localDate: { notIn: journal.plans.map((p) => p.date) },
        },
      });
      for (const p of journal.reviews)
        await tx.sessionReview.upsert({
          where: { userId_localDate: { userId, localDate: p.date } },
          create: {
            userId,
            localDate: p.date,
            planScore: p.planScore,
            bestTradeId: p.bestTradeId,
            worstMistake: p.worstMistake,
            tomorrowAction: p.tomorrowAction,
          },
          update: {
            planScore: p.planScore,
            bestTradeId: p.bestTradeId,
            worstMistake: p.worstMistake,
            tomorrowAction: p.tomorrowAction,
          },
        });
      await tx.sessionReview.deleteMany({
        where: {
          userId,
          localDate: { notIn: journal.reviews.map((p) => p.date) },
        },
      });
      await tx.goal.deleteMany({ where: { userId } });
      if (journal.goals.length)
        await tx.goal.createMany({
          data: journal.goals.map((g) => ({
            id: key(g.id),
            userId,
            label: g.label,
            unit: g.unit,
            target: g.target,
            startsAt: new Date(g.startsAt),
            endsAt: new Date(g.endsAt),
          })),
        });
      await tx.lockRule.deleteMany({ where: { account: { userId } } });
      if (journal.rules.length)
        await tx.lockRule.createMany({
          data: journal.rules.map((r) => ({
            accountId: key(r.accountId),
            enabled: r.enabled,
            maxTrades: r.maxTrades,
            maxConsecutiveLosses: r.maxConsecutiveLosses,
            dailyLossLimit: r.dailyLossLimit,
            cutoffNy: r.cutoffNy,
            cooldownMinutes: r.cooldownMinutes,
          })),
        });
      await tx.coachMessage.deleteMany({ where: { userId } });
      if (journal.messages.length)
        await tx.coachMessage.createMany({
          data: journal.messages.map((m) => ({
            id: key(m.id),
            userId,
            role: m.role,
            content: m.content,
            model: m.source,
            createdAt: new Date(m.createdAt),
          })),
        });
      for (const b of journal.imports) {
        const accountId =
          journal.trades.find((t) => t.importBatchId === b.id)?.accountId ??
          journal.accounts[0]?.id;
        if (accountId)
          await tx.importBatch.upsert({
            where: { id: key(b.id) },
            create: {
              id: key(b.id),
              accountId: key(accountId),
              filename: b.filename,
              source: b.source,
              columnMappingJson: JSON.stringify(b.mapping),
            },
            update: {},
          });
      }
      for (const t of journal.trades)
        if (
          t.importBatchId &&
          journal.imports.some((b) => b.id === t.importBatchId)
        )
          await tx.trade.update({
            where: { id: key(t.id) },
            data: { importBatchId: key(t.importBatchId) },
          });
    },
    {
      timeout: 120000,
      maxWait: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
  return { data: journal, revision: expected + 1 };
}
