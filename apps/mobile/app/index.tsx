import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SQLite from "expo-sqlite";
import * as FS from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Documents from "expo-document-picker";
import * as Images from "expo-image-picker";
import Svg, { Polyline, Line, Rect } from "react-native-svg";
import {
  newJournal,
  accountLabel, accountSymbols, positionQuantity, averagePlan,
  journalSchema,
  tradeSchema,
  calculateTrade,
  summarize,
  groupByDay,
  nyDate,
  zonedToUtc,
  localDateTime,
  accountStatus,
  guardStatus,
  behavioralAnalysis,
  reviewSummary,
  breakdown,
  coachReply,
  parseCsv,
  detectColumns,
  normalizeImport,
  type Journal,
  type Trade,
  type Account,
} from "@edge/core";
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const rr = (v: number) => (v > 0 ? "+" : "") + v.toFixed(2) + "R";
const usd = (v: number) => v.toFixed(0) + " $";
const mono = Platform.OS === "ios" ? "Menlo" : "monospace";
const TABS = [
  "Cockpit",
  "Journal",
  "Analyses",
  "Calendrier",
  "Fuites",
  "Comptes",
  "Plan & revue",
  "Playbook",
  "Objectifs",
  "Coach",
  "Calculateur",
  "Import / sauvegarde",
] as const;
function Card({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[s.button, secondary && s.secondary, disabled && { opacity: 0.4 }]}
    >
      <Text style={[s.buttonText, secondary && { color: "#b9dfed" }]}>
        {label}
      </Text>
    </Pressable>
  );
}
function Input({
  label,
  value,
  onChange,
  numeric = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "decimal-pad" : "default"}
        style={[
          s.input,
          multiline && { minHeight: 85, textAlignVertical: "top" },
        ]}
        multiline={multiline}
        autoCapitalize="none"
      />
    </View>
  );
}
function Choices({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.choices}>
          {values.map((v) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: v === value }}
              key={v}
              onPress={() => onChange(v)}
              style={[s.choice, v === value && s.choiceActive]}
            >
              <Text style={s.body}>{v}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
export default function App() {
  const [data, setData] = useState<Journal | null>(null);
  const current = useRef<Journal | null>(null),
    db = useRef<SQLite.SQLiteDatabase | null>(null),
    writes = useRef(Promise.resolve());
  const [status, setStatus] = useState("Ouverture SQLite…"),
    [view, setView] = useState<string>("Cockpit"),
    [account, setAccount] = useState("all"),
    [instrument, setInstrument] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [date, setDate] = useState(nyDate(new Date().toISOString())),
    [editor, setEditor] = useState<Trade | "new" | null>(null),
    [detail, setDetail] = useState<Trade | null>(null),
    [dialog, setDialog] = useState<{
      title: string;
      fields: { key: string; label: string; value: string }[];
      save: (values: Record<string, string>) => void;
    } | null>(null),
    [query, setQuery] = useState(""),
    [importData, setImportData] = useState<ReturnType<
      typeof normalizeImport
    > | null>(null),
    [importsFile, setImportsFile] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      const connection = await SQLite.openDatabaseAsync("edge-journal.db");
      db.current = connection;
      await connection.execAsync(
        "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS journal (id INTEGER PRIMARY KEY CHECK (id=1), data TEXT NOT NULL);",
      );
      const row = await connection.getFirstAsync<{ data: string }>(
        "SELECT data FROM journal WHERE id=1",
      );
      const journal = row
        ? journalSchema.parse(JSON.parse(row.data))
        : newJournal();
      current.current = journal;
      if (active) {
        setData(journal);
        setStatus("SQLite local · hors ligne disponible");
      }
    })().catch((e) => setStatus(String(e)));
    return () => {
      active = false;
    };
  }, []);
  function update(fn: (j: Journal) => void) {
    try {
      const next = JSON.parse(JSON.stringify(current.current)) as Journal;
      fn(next);
      const parsed = journalSchema.parse(next);
      current.current = parsed;
      setData(parsed);
      setStatus("Écriture SQLite…");
      writes.current = writes.current
        .catch(() => {})
        .then(async () => {
          await db.current!.runAsync(
            "INSERT INTO journal(id,data) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
            JSON.stringify(parsed),
          );
          setStatus("SQLite local · enregistré");
        })
        .catch((e) => {
          setStatus("Erreur de stockage : exporte une sauvegarde.");
          Alert.alert("Écriture impossible", String(e));
        });
    } catch (e) {
      Alert.alert("Vérifie les données", String(e));
    }
  }
  async function backup(j = current.current!) {
    await writes.current;
    const uri = FS.documentDirectory + `EDGE-${Date.now()}.json`;
    await FS.writeAsStringAsync(uri, JSON.stringify(j));
    if (await Sharing.isAvailableAsync())
      await Sharing.shareAsync(uri, { mimeType: "application/json" });
    else Alert.alert("Sauvegarde locale", uri);
    return uri;
  }
  if (!data)
    return (
      <SafeAreaView style={s.root}>
        <View style={s.loading}>
          <ActivityIndicator color="#46deed" />
          <Text style={s.body}>{status}</Text>
        </View>
      </SafeAreaView>
    );
  const journal = data;
  const filtered = data.trades.filter(
    (t) =>
      (account === "all" || t.accountId === account) &&
      (instrument === "all" || t.instrument === instrument) &&
      (!from || nyDate(t.exitedAt) >= from) &&
      (!to || nyDate(t.exitedAt) <= to),
  );
  const stats = summarize(filtered),
    days = groupByDay(filtered);
  const selectedAccount =
    data.accounts.find((a) => a.id === account) ?? data.accounts[0];
  const guard = selectedAccount ? guardStatus(data, selectedAccount.id) : null;
  const brief = reviewSummary(filtered, data.settings.minSample);
  const plan = data.plans.find((p) => p.date === date);
  const ts = filtered.filter((t) => nyDate(t.exitedAt) === date);
  function openForm(
    title: string,
    fields: { key: string; label: string; value: string }[],
    save: (values: Record<string, string>) => void,
  ) {
    setDialog({ title, fields, save });
  }
  function routine() {
    openForm(
      "Plan de la séance " + date,
      [
        {
          key: "levels",
          label: "Biais HTF / niveaux clés",
          value: plan?.levels ?? "",
        },
        {
          key: "optionLevels",
          label: "Call wall / put wall / zero gamma",
          value: plan?.optionLevels ?? "",
        },
        {
          key: "volumeZones",
          label: "POC / HVN / zones Bookmap",
          value: plan?.volumeZones ?? "",
        },
        {
          key: "events",
          label: "Annonces du jour · notes manuelles",
          value: plan?.events ?? "",
        },
        { key: "mental", label: "État mental", value: plan?.mental ?? "Calme" },
        {
          key: "maxTrades",
          label: "Trades autorisés",
          value: String(plan?.maxTrades ?? 3),
        },
        {
          key: "setups",
          label: "Setups autorisés · séparer par virgules",
          value:
            plan?.allowedSetups.join(", ") ?? journal.setups[0]?.name ?? "",
        },
      ],
      (v) =>
        update(
          (j) =>
            (j.plans = [
              ...j.plans.filter((p) => p.date !== date),
              {
                date,
                checks: [false, false, false, false, false, false],
                levels: v.levels,
                optionLevels: v.optionLevels,
                volumeZones: v.volumeZones,
                events: v.events,
                mental: v.mental,
                maxTrades: Number(v.maxTrades),
                allowedSetups: v.setups
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                validatedAt: null,
              },
            ]),
        ),
    );
  }
  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>
          EDGE<Text style={{ color: "#46deed" }}>/</Text>
        </Text>
        <Text style={s.badge}>{data.mode === "demo" ? "DÉMO" : "LOCAL"}</Text>
      </View>
      <ScrollView
        horizontal
        style={s.tabs}
        showsHorizontalScrollIndicator={false}
      >
        <View style={s.choices}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setView(tab)}
              style={[s.choice, view === tab && s.choiceActive]}
            >
              <Text style={s.body}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.over}>{status}</Text>
        <Text style={s.title}>{view}</Text>
        <Button label="+ Nouveau trade" onPress={() => setEditor("new")} />
        <Choices
          label="Compte"
          values={["all", ...data.accounts.map((a) => a.id)]}
          value={account}
          onChange={setAccount}
        />
        <Choices
          label="Instrument"
          values={["all", ...Object.keys(data.settings.instruments)]}
          value={instrument}
          onChange={setInstrument}
        />
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Input label="Du · AAAA-MM-JJ ET" value={from} onChange={setFrom} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Au · AAAA-MM-JJ ET" value={to} onChange={setTo} />
          </View>
        </View>
        {view === "Cockpit" && (
          <>
            <Card>
              <Text style={s.over}>PERFORMANCE NETTE</Text>
              <Text
                style={[
                  s.value,
                  { color: stats.r >= 0 ? "#67e5ab" : "#f17a9e" },
                ]}
              >
                {rr(stats.r)}
              </Text>
              <Text style={s.body}>
                {usd(stats.net)} · {(stats.winRate * 100).toFixed(1)} % de
                réussite · {stats.count} trades
              </Text>
              <Text style={s.body}>
                Espérance {rr(stats.expectancy)} · Drawdown{" "}
                {usd(stats.drawdown)}
              </Text>
              <Curve trades={filtered} />
            </Card>
            <Card>
              <Text style={s.h2}>Action pour la prochaine séance</Text>
              <Text style={s.body}>{brief.action}</Text>
            </Card>
            {selectedAccount && (
              <Card>
                <Text style={s.h2}>{selectedAccount.name}</Text>
                <Text style={s.body}>
                  Marge de drawdown :{" "}
                  {usd(accountStatus(selectedAccount, data.trades).remaining)}
                </Text>
                <Text style={s.body}>
                  Budget journalier restant :{" "}
                  {usd(
                    accountStatus(selectedAccount, data.trades).dailyRemaining,
                  )}
                </Text>
                <Text style={s.body}>
                  Plan {date} : {plan?.validatedAt ? "validé" : "à préparer"}
                </Text>
                <Button
                  label={
                    guard?.locked
                      ? "Lock Guard actif · pause"
                      : "Consulter le garde-fou"
                  }
                  secondary
                  onPress={() => setView("Comptes")}
                />
              </Card>
            )}
          </>
        )}
        {view === "Journal" && (
          <>
            <Input label="Recherche" value={query} onChange={setQuery} />
            {[...filtered]
              .reverse()
              .filter((t) =>
                `${t.instrument} ${t.setup} ${t.notes}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setDetail(t)}
                  style={s.trade}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.h2}>
                      {t.instrument} ·{" "}
                      {t.direction === "LONG" ? "Achat" : "Vente"}
                    </Text>
                    <Text style={s.body}>{t.setup}</Text>
                    <Text style={s.label}>
                      {localDateTime(t.enteredAt).replace("T", " ")} ET
                    </Text>
                  </View>
                  <Text
                    style={[
                      s.result,
                      {
                        color:
                          calculateTrade(t).net >= 0 ? "#67e5ab" : "#f17a9e",
                      },
                    ]}
                  >
                    {rr(calculateTrade(t).realizedR)}
                  </Text>
                </Pressable>
              ))}
          </>
        )}
        {view === "Analyses" && (
          <>
            <Card>
              <Text style={s.h2}>Statistiques et exécution</Text>
              <Text style={s.body}>
                Gain moyen {rr(stats.averageWinR)} / perte moyenne{" "}
                {rr(stats.averageLossR)}
              </Text>
              <Text style={s.body}>
                Profit factor{" "}
                {stats.profitFactor?.toFixed(2) ?? "Non calculable sans perte"}
              </Text>
              <Text style={s.body}>
                Séries max. : {stats.maxWinStreak} gains / {stats.maxLossStreak}{" "}
                pertes
              </Text>
              <Curve trades={filtered} />
            </Card>
            {(["setup", "instrument", "session", "timeframe"] as const).map(
              (key) => (
                <Card key={key}>
                  <Text style={s.h2}>Par {key}</Text>
                  {breakdown(
                    filtered,
                    (t) => t[key],
                    data.settings.minSample,
                  ).map((g) => (
                    <View key={g.label} style={s.statRow}>
                      <Text style={[s.body, { flex: 1 }]}>
                        {g.label}
                        {"\n"}
                        {g.count} observations ·{" "}
                        {g.reliable ? "seuil atteint" : "limité"}
                      </Text>
                      <Text style={s.result}>{rr(g.expectancy)}</Text>
                    </View>
                  ))}
                </Card>
              ),
            )}
          </>
        )}
        {view === "Calendrier" && (
          <>
            <Input
              label="Séance sélectionnée · AAAA-MM-JJ ET"
              value={date}
              onChange={setDate}
            />
            <View style={s.heatmap}>
              {Object.entries(days)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([day, d]) => (
                  <Pressable
                    key={day}
                    onPress={() => setDate(day)}
                    style={[
                      s.day,
                      { backgroundColor: d.r >= 0 ? "#123426" : "#3c2030" },
                    ]}
                  >
                    <Text style={s.label}>{day.slice(5)}</Text>
                    <Text style={s.body}>{rr(d.r)}</Text>
                    <Text style={s.label}>{d.count} trades</Text>
                  </Pressable>
                ))}
            </View>
            <Text style={s.h2}>
              {date} · {rr(summarize(ts).r)}
            </Text>
            {ts.map((t) => (
              <Button
                key={t.id}
                label={t.instrument + " · " + rr(calculateTrade(t).realizedR)}
                secondary
                onPress={() => setDetail(t)}
              />
            ))}
          </>
        )}
        {view === "Fuites" && (
          <>
            <Text style={s.body}>
              Seuil {data.settings.minSample} observations. Groupes descriptifs
              qui se chevauchent, à ne pas additionner.
            </Text>
            {behavioralAnalysis(filtered, data.settings.minSample)
              .filter((g) => g.net < 0)
              .map((g) => (
                <Card key={g.category + g.label}>
                  <Text style={s.over}>{g.category}</Text>
                  <Text style={s.h2}>{g.label}</Text>
                  <Text style={[s.value, { fontSize: 26, color: "#f17a9e" }]}>
                    {rr(g.r)}
                  </Text>
                  <Text style={s.body}>
                    {g.count} trades · {rr(g.expectancy)} par trade
                  </Text>
                  <Text style={s.body}>
                    Prochaine séance : exige une confirmation documentée dans ce
                    contexte.
                  </Text>
                </Card>
              ))}
          </>
        )}
        {view === "Comptes" && (
          <>
            <Button
              label="Ajouter un compte"
              secondary
              onPress={() => editAccount()}
            />
            {data.accounts.map((a) => {
              const p = accountStatus(
                a,
                data.trades,
                new Date().toISOString(),
                data.settings.riskBudget,
              );
              const g = guardStatus(data, a.id);
              return (
                <Card key={a.id}>
                  <Text style={s.h2}>{accountLabel(a)}</Text>
                  <Text style={s.value}>{usd(p.balance)}</Text>
                  <Text style={s.body}>
                    Marge drawdown : {usd(p.remaining)} · quotidien{" "}
                    {usd(p.dailyRemaining)}
                  </Text>
                  <Text style={s.body}>
                    Consistance :{" "}
                    {p.consistency === null
                      ? "non calculable"
                      : (p.consistency * 100).toFixed(1) + " %"}{" "}
                    / {a.consistencyLimit * 100} %
                  </Text>
                  <Text style={s.body}>
                    Simulation perte {usd(data.settings.riskBudget)} → marge{" "}
                    {usd(p.simulatedMargin)}
                  </Text>
                  <Text style={s.body}>
                    Jours {p.days}/{a.minTradingDays}
                  </Text>
                  <Button
                    label="Modifier règles et limites"
                    secondary
                    onPress={() => editAccount(a)}
                  />
                  {g.locked && (
                    <>
                      <Text style={[s.body, { color: "#f17a9e" }]}>
                        {g.reasons.join(" · ")}
                      </Text>
                      <Text style={s.body}>
                        Pause restante au contrôle : {g.waitSeconds} s
                      </Text>
                      <Button
                        label="Note de dérogation · après la pause"
                        secondary
                        onPress={() =>
                          openForm(
                            "Dérogation tracée",
                            [
                              {
                                key: "note",
                                label:
                                  "Pourquoi reprendre ? (10 caractères minimum)",
                                value: "",
                              },
                            ],
                            (v) => {
                              const currentGuard = guardStatus(
                                current.current!,
                                a.id,
                              );
                              if (currentGuard.waitSeconds > 0)
                                throw new Error(
                                  "Pause encore active : " +
                                    currentGuard.waitSeconds +
                                    " secondes.",
                                );
                              if (v.note.trim().length < 10)
                                throw new Error(
                                  "La note doit expliquer la reprise.",
                                );
                              update((j) =>
                                j.overrides.push({
                                  accountId: a.id,
                                  day: nyDate(new Date().toISOString()),
                                  note: v.note,
                                  createdAt: new Date().toISOString(),
                                  until: new Date(
                                    Date.now() + 600000,
                                  ).toISOString(),
                                  reason: currentGuard.reasons.join(" · "),
                                }),
                              );
                            },
                          )
                        }
                      />
                    </>
                  )}
                </Card>
              );
            })}
          </>
        )}
        {view === "Plan & revue" && (
          <>
            <Input
              label="Séance · AAAA-MM-JJ ET"
              value={date}
              onChange={setDate}
            />
            <Button label="Créer / modifier le plan" onPress={routine} />
            {plan && (
              <Card>
                <Text style={s.h2}>Checklist obligatoire</Text>
                {[
                  "Biais et niveaux",
                  "Niveaux option flow",
                  "POC / HVN / Bookmap",
                  "Annonces vérifiées",
                  "État mental évalué",
                  "Risque et setups définis",
                ].map((label, i) => (
                  <Pressable
                    key={label}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: plan.checks[i] }}
                    onPress={() =>
                      update((j) => {
                        const p = j.plans.find((p) => p.date === date)!;
                        p.checks[i] = !p.checks[i];
                        p.validatedAt = null;
                      })
                    }
                    style={s.check}
                  >
                    <Text style={s.body}>
                      {plan.checks[i] ? "☑" : "☐"} {label}
                    </Text>
                  </Pressable>
                ))}
                <Button
                  label={
                    plan.validatedAt
                      ? "Préparation validée"
                      : "Valider la préparation"
                  }
                  disabled={
                    !plan.checks.every(Boolean) || !plan.allowedSetups.length
                  }
                  onPress={() =>
                    update(
                      (j) =>
                        (j.plans.find((p) => p.date === date)!.validatedAt =
                          new Date().toISOString()),
                    )
                  }
                />
              </Card>
            )}
            <Button
              secondary
              label="Revue de fin de séance"
              onPress={() => {
                const old = data.reviews.find((r) => r.date === date);
                openForm(
                  "Revue " + date,
                  [
                    {
                      key: "planScore",
                      label: "Respect du plan · 0 à 10",
                      value: String(old?.planScore ?? 8),
                    },
                    {
                      key: "worstMistake",
                      label: "Pire erreur",
                      value: old?.worstMistake ?? "",
                    },
                    {
                      key: "tomorrowAction",
                      label: "Une action pour demain",
                      value: old?.tomorrowAction ?? "",
                    },
                  ],
                  (v) =>
                    update(
                      (j) =>
                        (j.reviews = [
                          ...j.reviews.filter((r) => r.date !== date),
                          {
                            date,
                            planScore: Number(v.planScore),
                            worstMistake: v.worstMistake,
                            tomorrowAction: v.tomorrowAction,
                            bestTradeId: "",
                          },
                        ]),
                    ),
                );
              }}
            />
            {data.reviews
              .slice(-5)
              .reverse()
              .map((review) => (
                <Card key={review.date}>
                  <Text style={s.h2}>
                    {review.date} · {review.planScore}/10
                  </Text>
                  <Text style={s.body}>{review.tomorrowAction}</Text>
                </Card>
              ))}
          </>
        )}
        {view === "Playbook" && (
          <>
            <Button label="Créer un setup" onPress={() => editSetup()} />
            {data.setups.map((setup) => (
              <Card key={setup.id}>
                <Text style={s.h2}>{setup.name}</Text>
                <Text style={s.body}>{setup.entryRules}</Text>
                <Text style={s.body}>Invalidation : {setup.invalidation}</Text>
                <Text style={s.result}>
                  {rr(
                    summarize(data.trades.filter((t) => t.setup === setup.name))
                      .expectancy,
                  )}{" "}
                  / trade
                </Text>
                <Button
                  secondary
                  label="Modifier"
                  onPress={() => editSetup(setup)}
                />
              </Card>
            ))}
          </>
        )}
        {view === "Objectifs" && (
          <>
            <Button
              label="Nouvel objectif"
              onPress={() =>
                openForm(
                  "Objectif",
                  [
                    { key: "label", label: "Nom", value: "" },
                    {
                      key: "unit",
                      label: "Unité : R / USD / DISCIPLINE",
                      value: "R",
                    },
                    { key: "target", label: "Cible", value: "10" },
                    {
                      key: "start",
                      label: "Début AAAA-MM-JJ",
                      value: date.slice(0, 7) + "-01",
                    },
                    { key: "end", label: "Fin AAAA-MM-JJ", value: date },
                  ],
                  (v) =>
                    update((j) =>
                      j.goals.push({
                        id: uid(),
                        label: v.label,
                        unit: v.unit as "R",
                        target: Number(v.target),
                        startsAt: zonedToUtc(v.start + "T00:00"),
                        endsAt: zonedToUtc(v.end + "T23:59:59"),
                      }),
                    ),
                )
              }
            />
            {data.goals.map((g) => {
              const ts = data.trades.filter(
                  (t) => t.exitedAt >= g.startsAt && t.exitedAt <= g.endsAt,
                ),
                st = summarize(ts),
                value =
                  g.unit === "R"
                    ? st.r
                    : g.unit === "USD"
                      ? st.net
                      : (averagePlan(ts) ?? 0) * 10;
              return (
                <Card key={g.id}>
                  <Text style={s.h2}>{g.label}</Text>
                  <Text style={s.value}>
                    {value.toFixed(1)} / {g.target}
                  </Text>
                  <Text style={s.body}>
                    {g.unit} · {g.startsAt.slice(0, 10)} →{" "}
                    {g.endsAt.slice(0, 10)}
                  </Text>
                </Card>
              );
            })}
          </>
        )}
        {view === "Coach" && (
          <>
            <Card>
              <Text style={s.h2}>Coach local · sans API</Text>
              <Text style={s.body}>
                Statistiques de la sélection actuelle, sans Internet. L’API
                distante est disponible dans le web, avec consentement.
              </Text>
              <Input
                label="Ta question"
                value={query}
                onChange={setQuery}
                multiline
              />
              <Button
                label="Analyser mes données"
                onPress={() => {
                  const content = coachReply(
                    query,
                    filtered,
                    data.settings.minSample,
                  );
                  update((j) =>
                    j.messages.push(
                      {
                        id: uid(),
                        role: "user",
                        content: query,
                        createdAt: new Date().toISOString(),
                        source: "local",
                      },
                      {
                        id: uid(),
                        role: "assistant",
                        content,
                        createdAt: new Date().toISOString(),
                        source: "local",
                      },
                    ),
                  );
                  setQuery("");
                }}
              />
            </Card>
            {data.messages.slice(-10).map((m) => (
              <Card key={m.id}>
                <Text style={s.over}>
                  {m.role === "user" ? "TOI" : "COACH LOCAL"}
                </Text>
                <Text style={s.body}>{m.content}</Text>
              </Card>
            ))}
            <Card>
              <Text style={s.h2}>Revue automatique de la sélection</Text>
              <Text style={s.body}>
                {stats.count} trades · {rr(stats.r)}
              </Text>
              <Text style={s.body}>{brief.action}</Text>
            </Card>
          </>
        )}
        {view === "Calculateur" && <PositionCalculator journal={data} />}
        {view === "Import / sauvegarde" && (
          <>
            <Card>
              <Text style={s.h2}>Sauvegarde portable web / mobile</Text>
              <Text style={s.body}>
                JSON complet compatible avec le web. Les bases du PC et du
                téléphone sont indépendantes ; le transfert est explicite par
                fichier.
              </Text>
              <Button
                label="Exporter / partager mon JSON"
                onPress={() =>
                  void backup().catch((e) => Alert.alert("Export", String(e)))
                }
              />
              <Button
                label="Restaurer une sauvegarde JSON"
                secondary
                onPress={async () => {
                  try {
                    const result = await Documents.getDocumentAsync({
                      type: "application/json",
                      copyToCacheDirectory: true,
                    });
                    if (result.canceled) return;
                    const text = await FS.readAsStringAsync(
                      result.assets[0].uri,
                    );
                    const parsed = journalSchema.parse(JSON.parse(text));
                    Alert.alert(
                      "Restaurer " + parsed.trades.length + " trades",
                      "Le journal sera remplacé ; une copie de l’actuel sera conservée dans les fichiers de l’application.",
                      [
                        { text: "Annuler" },
                        {
                          text: "Sauvegarder puis restaurer",
                          onPress: () => {
                            void FS.writeAsStringAsync(
                              FS.documentDirectory +
                                "EDGE-avant-restauration-" +
                                Date.now() +
                                ".json",
                              JSON.stringify(current.current),
                            )
                              .then(() =>
                                update((j) => Object.assign(j, parsed)),
                              )
                              .catch((e) =>
                                Alert.alert("Restauration", String(e)),
                              );
                          },
                        },
                      ],
                    );
                  } catch (e) {
                    Alert.alert("Import JSON", String(e));
                  }
                }}
              />
              <Button
                label="Importer un CSV de positions clôturées"
                secondary
                onPress={async () => {
                  try {
                    const result = await Documents.getDocumentAsync({
                      type: [
                        "text/csv",
                        "text/comma-separated-values",
                        "application/octet-stream",
                      ],
                      copyToCacheDirectory: true,
                    });
                    if (result.canceled) return;
                    const text = await FS.readAsStringAsync(
                      result.assets[0].uri,
                    );
                    const table = parseCsv(text);
                    const preview = normalizeImport(
                      table.rows,
                      detectColumns(table.columns),
                      data,
                      {
                        accountId: selectedAccount?.id ?? "",
                        zone: "America/New_York",
                        dayFirst: true,
                        defaultStopPoints: 0,
                        defaultRR: 2,
                        batchId: uid(),
                      },
                    );
                    setImportData(preview);
                    setImportsFile(result.assets[0].name);
                  } catch (e) {
                    Alert.alert("CSV", String(e));
                  }
                }}
              />
              {importData && (
                <>
                  <Text style={s.body}>
                    {importsFile} : {importData.accepted.length} valides,{" "}
                    {importData.duplicates} doublons, {importData.errors.length}{" "}
                    rejets.
                  </Text>
                  <Text style={s.body}>
                    CSV mobile : stops et objectifs réels requis, dates sans
                    offset en heure de New York. Pour XLSX et mapping adaptatif,
                    utilise le web puis transfère le JSON.
                  </Text>
                  {importData.accepted.slice(0, 5).map((t) => (
                    <Text key={t.id} style={s.body}>
                      {t.instrument} · {rr(calculateTrade(t).realizedR)}
                    </Text>
                  ))}
                  {importData.errors.slice(0, 5).map((e) => (
                    <Text key={e.row} style={s.body}>
                      Ligne {e.row} : {e.message}
                    </Text>
                  ))}
                  <Button
                    disabled={!importData.accepted.length}
                    label="Importer les lignes valides"
                    onPress={() => {
                      update((j) => j.trades.push(...importData.accepted));
                      setImportData(null);
                    }}
                  />
                </>
              )}
              <Button
                label="Charger la démo (avec sauvegarde locale)"
                secondary
                onPress={() =>
                  Alert.alert(
                    "Remplacer le journal ?",
                    "Une sauvegarde sera conservée sur cet appareil.",
                    [
                      { text: "Annuler" },
                      {
                        text: "Charger la démo",
                        onPress: () => {
                          void FS.writeAsStringAsync(
                            FS.documentDirectory +
                              "EDGE-avant-demo-" +
                              Date.now() +
                              ".json",
                            JSON.stringify(current.current),
                          ).then(() =>
                            update((j) => Object.assign(j, newJournal(true))),
                          );
                        },
                      },
                    ],
                  )
                }
              />
              <Text style={s.body}>
                Aucun serveur ni compte cloud n’est nécessaire au mobile.
                Protège l’appareil avec son verrouillage système.
              </Text>
            </Card>
          </>
        )}
        <Text style={s.footer}>EDGE / DISCIPLINE AVANT LE PROFIT · v1.0</Text>
      </ScrollView>
      {editor && (
        <TradeForm
          journal={data}
          trade={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onSave={(t) => {
            update((j) => {
              j.trades = j.trades.some((p) => p.id === t.id)
                ? j.trades.map((p) => (p.id === t.id ? t : p))
                : [...j.trades, t];
              if (!j.setups.some((s) => s.name === t.setup))
                j.setups.push({
                  id: uid(),
                  name: t.setup,
                  entryRules: "À documenter",
                  invalidation: "À documenter",
                  examples: [],
                });
            });
            setEditor(null);
          }}
        />
      )}
      {detail && (
        <Modal animationType="slide" onRequestClose={() => setDetail(null)}>
          <SafeAreaView style={s.root}>
            <ScrollView contentContainerStyle={s.content}>
              <Button
                label="Retour"
                secondary
                onPress={() => setDetail(null)}
              />
              <Text style={s.title}>{detail.instrument}</Text>
              <Text style={s.value}>
                {rr(calculateTrade(detail).realizedR)}
              </Text>
              <Text style={s.body}>
                {detail.setup} · {detail.mentalBefore} → {detail.mentalAfter}
              </Text>
              <Card>
                <Text style={s.body}>
                  Plan : {detail.planScore}/10 · {detail.timeframe}
                </Text>
                <Text style={s.body}>
                  Entrée {localDateTime(detail.enteredAt)} : {detail.entry}
                </Text>
                <Text style={s.body}>
                  Stop {detail.stop} · objectif {detail.target}
                </Text>
                <Text style={s.body}>
                  Sortie {localDateTime(detail.exitedAt)} : {detail.exit}
                </Text>
                <Text style={s.body}>{detail.notes}</Text>
                <Text style={s.body}>
                  Leçon : {detail.lesson ?? "À renseigner"}
                </Text>
              </Card>
              {detail.screenshots?.map((image) => (
                <View key={image.id}>
                  <Text style={s.body}>{image.phase}</Text>
                  <NativeShot shot={image} />
                </View>
              ))}
              <Button
                label="Modifier le trade"
                onPress={() => {
                  setEditor(detail);
                  setDetail(null);
                }}
              />
              <Button
                secondary
                label="Sauvegarder puis retirer"
                onPress={() => {
                  Alert.alert(
                    "Retirer ce trade ?",
                    "Une sauvegarde complète est conservée localement.",
                    [
                      { text: "Annuler" },
                      {
                        text: "Confirmer",
                        onPress: () => {
                          void FS.writeAsStringAsync(
                            FS.documentDirectory +
                              "EDGE-avant-retrait-" +
                              Date.now() +
                              ".json",
                            JSON.stringify(current.current),
                          ).then(() => {
                            update(
                              (j) =>
                                (j.trades = j.trades.filter(
                                  (t) => t.id !== detail.id,
                                )),
                            );
                            setDetail(null);
                          });
                        },
                      },
                    ],
                  );
                }}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
      {dialog && (
        <GenericForm
          title={dialog.title}
          fields={dialog.fields}
          onClose={() => setDialog(null)}
          onSave={(v) => {
            dialog.save(v);
            setDialog(null);
          }}
        />
      )}
    </SafeAreaView>
  );
  function editSetup(setup?: Journal["setups"][number]) {
    openForm(
      "Setup",
      [
        { key: "name", label: "Nom", value: setup?.name ?? "" },
        {
          key: "entryRules",
          label: "Règles d’entrée",
          value: setup?.entryRules ?? "",
        },
        {
          key: "invalidation",
          label: "Invalidation",
          value: setup?.invalidation ?? "",
        },
      ],
      (v) => {
        if (journal.setups.some((s) => s.name === v.name && s.id !== setup?.id))
          throw new Error("Nom déjà utilisé.");
        update((j) => {
          if (setup) {
            j.setups = j.setups.map((s) =>
              s.id === setup.id ? { ...s, ...v } : s,
            );
            j.trades = j.trades.map((t) =>
              t.setup === setup.name ? { ...t, setup: v.name } : t,
            );
          } else
            j.setups.push({
              id: uid(),
              name: v.name,
              entryRules: v.entryRules,
              invalidation: v.invalidation,
              examples: [],
            });
        });
      },
    );
  }
  function editAccount(account?: Account) {
    const a = account ?? {
      ...newJournal().accounts[0],
      id: uid(),
      name: "Nouveau compte",
    };
    const rule =
      journal.rules.find((r) => r.accountId === a.id) ?? newJournal().rules[0];
    const names: Record<string, string> = {
      name: "Nom",
      provider: "Prop firm / courtier",
      initialCapital: "Capital initial ($)",
      profitTarget: "Objectif ($)",
      maxDrawdown: "Drawdown maximal ($)",
      dailyLossLimit: "Perte journalière maximale ($)",
      consistencyLimit: "Consistance (0,3 = 30 %)",
      minTradingDays: "Jours minimum",
      maxContracts: "Contrats maximum",
      highWaterMark: "Plus haut capital constaté ($)",
      drawdownMode: "STATIC / TRAILING_CLOSED / TRAILING_EOD",
    };
    openForm(
      "Compte et règles",
      [
        ...Object.keys(names).map((key) => ({
          key,
          label: names[key],
          value: String(a[key as keyof Account]),
        })),
        { key: "market", label: "Type de compte", value: a.market ?? "" },
        {
          key: "maxTrades",
          label: "Trades maximum par jour",
          value: String(rule.maxTrades),
        },
        {
          key: "maxConsecutiveLosses",
          label: "Pertes consécutives maximum",
          value: String(rule.maxConsecutiveLosses),
        },
        {
          key: "cutoffNy",
          label: "Heure de coupure New York HH:MM",
          value: rule.cutoffNy,
        },
        {
          key: "cooldownMinutes",
          label: "Pause (minutes)",
          value: String(rule.cooldownMinutes),
        },
      ],
      (v) =>
        update((j) => {
          const next = {
            ...a,
            market: v.market === "CFD" ? "CFD" as const : v.market === "FUTURE" ? "FUTURE" as const : undefined,
            name: v.name,
            provider: v.provider,
            ...Object.fromEntries(
              [
                "initialCapital",
                "profitTarget",
                "maxDrawdown",
                "dailyLossLimit",
                "consistencyLimit",
                "minTradingDays",
                "maxContracts",
                "highWaterMark",
              ].map((k) => [k, Number(v[k])]),
            ),
            drawdownMode: v.drawdownMode as Account["drawdownMode"],
          };
          j.accounts = account
            ? j.accounts.map((x) => (x.id === a.id ? next : x))
            : [...j.accounts, next];
          j.rules = [
            ...j.rules.filter((r) => r.accountId !== a.id),
            {
              accountId: a.id,
              enabled: true,
              maxTrades: Number(v.maxTrades),
              maxConsecutiveLosses: Number(v.maxConsecutiveLosses),
              dailyLossLimit: Number(v.dailyLossLimit),
              cutoffNy: v.cutoffNy,
              cooldownMinutes: Number(v.cooldownMinutes),
            },
          ];
        }),
    );
  }
}
function GenericForm({
  title,
  fields,
  onClose,
  onSave,
}: {
  title: string;
  fields: { key: string; label: string; value: string }[];
  onClose: () => void;
  onSave: (v: Record<string, string>) => void;
}) {
  const [values, setValues] = useState(
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Button label="Annuler" secondary onPress={onClose} />
          <Text style={s.title}>{title}</Text>
          {fields.map((f) => f.key === "market" ? <Choices key={f.key} label={f.label} values={["FUTURE","CFD"]} value={values.market} onChange={market => setValues({...values,market})}/> : (
            <Input
              key={f.key}
              label={f.label}
              value={values[f.key]}
              onChange={(v) => setValues({ ...values, [f.key]: v })}
              multiline
            />
          ))}
          <Button
            label="Enregistrer"
            onPress={() => {
              try {
                if (fields.some(f => f.key === "market") && !values.market) throw new Error("Choisis Futures ou CFD.");
                onSave(values);
              } catch (e) {
                Alert.alert("Vérifie les champs", String(e));
              }
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
function TradeForm({
  journal,
  trade,
  onClose,
  onSave,
}: {
  journal: Journal;
  trade?: Trade;
  onClose: () => void;
  onSave: (t: Trade) => void;
}) {
  const [preferredSymbol, setSymbol] = useState(trade?.instrument ?? "NQ"),
    [account, setAccount] = useState(
      trade?.accountId ?? journal.accounts[0]?.id ?? "",
    ),
    [side, setSide] = useState(trade?.direction ?? "LONG"),
    [phase, setPhase] = useState("Avant");
  const [shots, setShots] = useState(trade?.screenshots ?? []);
  const symbols = accountSymbols(journal,account);
  if (trade?.accountId === account && !symbols.includes(trade.instrument)) symbols.push(trade.instrument);
  const symbol = symbols.includes(preferredSymbol) ? preferredSymbol : symbols[0] ?? "";
  const [details, setDetails] = useState(!!trade);
  const [values, setValues] = useState<Record<string, string>>({
    enteredAt: localDateTime(trade?.enteredAt ?? new Date().toISOString()),
    exitedAt: localDateTime(trade?.exitedAt ?? new Date().toISOString()),
    entry: String(trade?.entry ?? ""),
    stop: String(trade?.stop ?? ""),
    target: String(trade?.target ?? ""),
    exit: String(trade?.exit ?? ""),
    quantity: String(trade?.quantity ?? 1),
    fees: String(trade?.fees ?? 4.8),
    setup: trade?.setup ?? journal.setups[0]?.name ?? "Setup personnel",
    session: trade?.session ?? "New York open",
    timeframe: trade?.timeframe ?? "M1",
    quality: trade?.quality ?? "A",
    mentalBefore: trade?.mentalBefore ?? "Calme",
    mentalAfter: trade?.mentalAfter ?? "Calme",
    energy: String(trade?.energy ?? 4),
    stress: String(trade?.stress ?? 2),
    sleep: String(trade?.sleep ?? 7),
    planScore: String(trade?.planScore ?? 8),
    notes: trade?.notes ?? "",
    didWell: trade?.didWell ?? "",
    didWrong: trade?.didWrong ?? "",
    lesson: trade?.lesson ?? "",
    confluences: trade?.confluences.join(", ") ?? "",
    tags: trade?.tags?.join(", ") ?? "",
    mfeR: String(trade?.mfeR ?? ""),
    maeR: String(trade?.maeR ?? ""),
    postStopContinuationR: String(trade?.postStopContinuationR ?? ""),
  });
  const numbers = [
    "entry",
    "stop",
    "target",
    "exit",
    "quantity",
    "fees",
    "energy",
    "stress",
    "sleep",
    "planScore",
  ];
  const spec =
    trade?.instrument === symbol && trade.tickSize && trade.tickValue
      ? { tickSize: trade.tickSize, tickValue: trade.tickValue, category: trade.category, quantityStep: trade.quantityStep, minQuantity: trade.minQuantity }
      : journal.settings.instruments[symbol];
  const basic = [
    ["enteredAt", "Entrée · AAAA-MM-JJTHH:MM ET"],
    ["exitedAt", "Sortie · AAAA-MM-JJTHH:MM ET"],
    ["entry", "Prix d’entrée"],
    ["stop", "Stop initial"],
    ["target", "Objectif"],
    ["exit", "Prix de sortie"],
    ["quantity", "Contrats / lots"],
    ["fees", "Frais totaux ($)"],
    ["setup", "Setup personnel"],
    ["planScore", "Respect du plan · 0 à 10"],
  ];
  const advanced = [
    ["session", "Session"],
    ["timeframe", "Timeframe"],
    ["quality", "Qualité A / B / C"],
    ["mentalBefore", "Émotion avant"],
    ["mentalAfter", "Émotion après"],
    ["energy", "Énergie 1 à 5"],
    ["stress", "Stress 1 à 5"],
    ["sleep", "Sommeil (heures)"],
    ["confluences", "Confluences · séparées par virgules"],
    ["tags", "Tags · séparés par virgules"],
    ["notes", "Notes"],
    ["didWell", "Ce que j’ai bien fait"],
    ["didWrong", "Ce que j’ai mal fait"],
    ["lesson", "Leçon"],
    ["mfeR", "MFE en R · facultatif"],
    ["maeR", "MAE négative en R · facultatif"],
    ["postStopContinuationR", "Continuation après stop · R facultatif"],
  ];
  let metrics = null;
  try {
    metrics = calculateTrade({
      instrument: symbol,
      direction: side,
      ...Object.fromEntries(numbers.map((k) => [k, Number(values[k])])),
      ...spec,
    } as Trade);
  } catch {}
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Button label="Annuler" secondary onPress={onClose} />
          <Text style={s.title}>
            {trade ? "Modifier" : "Nouvelle exécution"}
          </Text>
          <Choices
            label="Compte"
            values={journal.accounts.map((a) => a.id)}
            value={account}
            onChange={setAccount}
          />
          <Choices
            label="Instrument"
            values={symbols}
            value={symbol}
            onChange={setSymbol}
          />
          <Choices
            label="Direction"
            values={["LONG", "SHORT"]}
            value={side}
            onChange={(v) => setSide(v as "LONG" | "SHORT")}
          />
          {basic.map(([key, label]) => (
            <Input
              key={key}
              label={label}
              value={values[key]}
              onChange={(v) => setValues({ ...values, [key]: v })}
              numeric={numbers.includes(key)}
            />
          ))}
          <Card>
            <Text style={s.h2}>
              Risque {metrics ? usd(metrics.risk) : "—"} · RR{" "}
              {metrics?.plannedR.toFixed(2) ?? "—"}
            </Text>
            <Text style={s.value}>{metrics ? rr(metrics.realizedR) : "—"}</Text>
          </Card>
          <Button
            label={
              details
                ? "Masquer le contexte"
                : "Compléter émotions, contexte et captures"
            }
            secondary
            onPress={() => setDetails(!details)}
          />
          {details && (
            <>
              {advanced.map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  value={values[key]}
                  onChange={(v) => setValues({ ...values, [key]: v })}
                  numeric={
                    numbers.includes(key) ||
                    ["mfeR", "maeR", "postStopContinuationR"].includes(key)
                  }
                  multiline={[
                    "notes",
                    "didWell",
                    "didWrong",
                    "lesson",
                  ].includes(key)}
                />
              ))}
              <Choices
                label="Phase de la capture"
                values={["Avant", "Après"]}
                value={phase}
                onChange={setPhase}
              />
              <Button
                label="Ajouter une capture de la galerie"
                secondary
                onPress={async () => {
                  try {
                    if (shots.length >= 10)
                      throw new Error("10 captures maximum.");
                    const result = await Images.launchImageLibraryAsync({
                      mediaTypes: ["images"],
                      quality: 0.6,
                      base64: true,
                    });
                    if (result.canceled) return;
                    const image = result.assets[0];
                    if (!image.base64 || image.base64.length > 2800000)
                      throw new Error(
                        "Image trop grande : réduis-la sous 2 Mo.",
                      );
                    setShots([
                      ...shots,
                      {
                        id: uid(),
                        phase,
                        data: "data:image/jpeg;base64," + image.base64,
                        annotations: "[]",
                      },
                    ]);
                  } catch (e) {
                    Alert.alert("Capture", String(e));
                  }
                }}
              />
              {shots.map((image) => (
                <View key={image.id}>
                  <NativeShot
                    shot={image}
                    onChange={(annotations) =>
                      setShots(
                        shots.map((s) =>
                          s.id === image.id ? { ...s, annotations } : s,
                        ),
                      )
                    }
                  />
                  <Button
                    label="Retirer cette capture"
                    secondary
                    onPress={() =>
                      setShots(shots.filter((s) => s.id !== image.id))
                    }
                  />
                </View>
              ))}
            </>
          )}
          <Button
            label="Enregistrer l’exécution"
            onPress={() => {
              try {
                if (!trade) {
                  const guard = guardStatus(journal, account);
                  if (guard.locked)
                    throw new Error(
                      "Lock Guard actif : ouvre la pause dans Comptes.",
                    );
                }
                const t = tradeSchema.parse({
                  ...trade,
                  ...values,
                  id: trade?.id ?? uid(),
                  accountId: account,
                  instrument: symbol,
                  direction: side,
                  ...Object.fromEntries(
                    numbers.map((k) => [k, Number(values[k])]),
                  ),
                  ...spec,
                  enteredAt: zonedToUtc(values.enteredAt),
                  exitedAt: zonedToUtc(values.exitedAt),
                  confluences: values.confluences
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  tags: values.tags
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  mfeR: values.mfeR ? Number(values.mfeR) : undefined,
                  maeR: values.maeR ? Number(values.maeR) : undefined,
                  postStopContinuationR: values.postStopContinuationR
                    ? Number(values.postStopContinuationR)
                    : undefined,
                  screenshots: shots,
                });
                onSave(t);
              } catch (e) {
                Alert.alert("Trade non enregistré", String(e));
              }
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
function NativeShot({
  shot,
  onChange,
}: {
  shot: NonNullable<Trade["screenshots"]>[number];
  onChange?: (s: string) => void;
}) {
  const [width, setWidth] = useState(300),
    [ratio, setRatio] = useState(1.6),
    [start, setStart] = useState<{ x: number; y: number } | null>(null);
  let marks: {
    type: string;
    x: number;
    y: number;
    x2: number;
    y2: number;
    text: string;
  }[] = [];
  try {
    marks = JSON.parse(shot.annotations);
  } catch {}
  const height = width / ratio;
  return (
    <View>
      <Text style={s.body}>
        {shot.phase} · {onChange ? "glisse pour annoter une flèche" : "capture"}
      </Text>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ width: "100%", height }}
        onStartShouldSetResponder={() => !!onChange}
        onResponderGrant={(e) =>
          setStart({
            x: (e.nativeEvent.locationX / width) * 100,
            y: (e.nativeEvent.locationY / height) * 100,
          })
        }
        onResponderRelease={(e) => {
          if (start)
            onChange?.(
              JSON.stringify([
                ...marks,
                {
                  type: "arrow",
                  ...start,
                  x2: (e.nativeEvent.locationX / width) * 100,
                  y2: (e.nativeEvent.locationY / height) * 100,
                  text: "",
                },
              ]),
            );
          setStart(null);
        }}
      >
        <Image
          source={{ uri: shot.data }}
          style={{ width: "100%", height }}
          resizeMode="contain"
          onLoad={(e) =>
            setRatio(e.nativeEvent.source.width / e.nativeEvent.source.height)
          }
        />
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={width}
          height={height}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {marks
            .filter((m) => m.type === "arrow")
            .map((m, i) => (
              <Line
                key={i}
                x1={m.x}
                y1={m.y}
                x2={m.x2}
                y2={m.y2}
                stroke="#46deed"
                strokeWidth=".6"
              />
            ))}
        </Svg>
      </View>
      {onChange && (
        <Button
          label="Annuler la dernière annotation"
          secondary
          onPress={() => onChange(JSON.stringify(marks.slice(0, -1)))}
        />
      )}
    </View>
  );
}
function Curve({ trades }: { trades: Trade[] }) {
  const curve = summarize(trades).curve;
  const values = [0, ...curve.map((x) => x.r)],
    min = Math.min(...values),
    range = Math.max(1, Math.max(...values) - min);
  const points = values
    .map(
      (v, i) =>
        `${(i / Math.max(1, values.length - 1)) * 300},${115 - ((v - min) / range) * 100}`,
    )
    .join(" ");
  return (
    <View
      accessible
      accessibilityLabel={"Courbe cumulée " + rr(summarize(trades).r)}
      style={{ height: 140 }}
    >
      <Svg width="100%" height="140" viewBox="0 0 300 140">
        <Line x1="0" y1="115" x2="300" y2="115" stroke="#2d4a59" />
        <Polyline
          points={points}
          fill="none"
          stroke="#46deed"
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
}
function PositionCalculator({ journal }: { journal: Journal }) {
  const [account, setAccount] = useState(journal.accounts[0]?.id ?? "");
  const [preferredSymbol, setSymbol] = useState("NQ"),
    [budget, setBudget] = useState("200"),
    [entry, setEntry] = useState("21400"),
    [stop, setStop] = useState("21390"),
    [fees, setFees] = useState("0");
  const symbols = accountSymbols(journal, account);
  const symbol = symbols.includes(preferredSymbol) ? preferredSymbol : symbols[0] ?? "";
  const spec = journal.settings.instruments[symbol];
  const unit = spec ?
    (Math.abs(Number(entry) - Number(stop)) * spec.tickValue) / spec.tickSize +
    Number(fees) : 0;
  const raw = Number(budget) > 0 && unit > 0 ? Number(budget) / unit : 0;
  const size =
    positionQuantity(Math.min(raw,journal.accounts.find(a => a.id === account)?.maxContracts ?? 0),spec?.quantityStep ?? 1,spec?.minQuantity ?? 1);
  return (
    <Card>
      <Text style={s.h2}>Taille selon le risque en dollars</Text>
      <Choices label="Compte" values={journal.accounts.map(a=>a.id)} value={account} onChange={setAccount}/>
      <Choices
        label="Instrument"
        value={symbol}
        values={symbols}
        onChange={setSymbol}
      />
      <Input numeric label="Budget ($)" value={budget} onChange={setBudget} />
      <Input numeric label="Entrée" value={entry} onChange={setEntry} />
      <Input numeric label="Stop" value={stop} onChange={setStop} />
      <Input
        numeric
        label="Frais par contrat / lot"
        value={fees}
        onChange={setFees}
      />
      <Text style={s.value}>
        {size} {spec?.category === "CFD" ? "lot(s)" : "contrat(s)"}
      </Text>
      <Text style={s.body}>
        Risque estimé : {usd(size * unit)}. Compare aussi à la limite de
        contrats de ton compte.
      </Text>
    </Card>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#05070a" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  logo: { fontSize: 30, fontWeight: "800", letterSpacing: 2, color: "#e4edf5" },
  badge: { fontFamily: mono, fontSize: 10, color: "#46deed" },
  tabs: { maxHeight: 62, paddingHorizontal: 14 },
  choices: { flexDirection: "row", gap: 8, paddingVertical: 6 },
  choice: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#293c49",
    backgroundColor: "#101a24",
    borderRadius: 6,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  choiceActive: { borderColor: "#46deed", backgroundColor: "#15333c" },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  over: { color: "#8bafc0", fontSize: 9, letterSpacing: 1.4, lineHeight: 16 },
  title: { fontSize: 29, color: "#e4edf5", fontWeight: "600" },
  h2: { fontSize: 16, color: "#e4edf5", fontWeight: "600" },
  body: { fontSize: 12, color: "#a6becd", lineHeight: 21 },
  card: {
    padding: 19,
    borderWidth: 1,
    borderColor: "#253a49",
    borderRadius: 11,
    backgroundColor: "#0d161f",
    gap: 13,
  },
  value: { fontSize: 34, fontFamily: mono, color: "#67e5ab" },
  result: { fontSize: 15, fontFamily: mono, color: "#80d9e6" },
  label: { fontSize: 10, color: "#8eacbf", lineHeight: 17 },
  field: { gap: 7, marginVertical: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#2c4556",
    borderRadius: 6,
    backgroundColor: "#09121b",
    color: "#e4edf5",
    padding: 12,
    fontSize: 13,
  },
  row: { flexDirection: "row", gap: 12 },
  button: {
    minHeight: 46,
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#46deed",
    justifyContent: "center",
    alignItems: "center",
  },
  secondary: {
    backgroundColor: "#10232f",
    borderWidth: 1,
    borderColor: "#315366",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#04212c",
    textAlign: "center",
  },
  trade: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#233b4a",
    backgroundColor: "#0e1923",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 86,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderBottomColor: "#263d4c",
    borderBottomWidth: 1,
    paddingVertical: 13,
  },
  heatmap: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  day: { minWidth: 90, padding: 13, borderRadius: 6, gap: 7 },
  check: {
    minHeight: 50,
    padding: 13,
    borderWidth: 1,
    borderColor: "#2b4655",
    borderRadius: 6,
  },
  footer: {
    fontSize: 8,
    letterSpacing: 1,
    color: "#748fa0",
    textAlign: "center",
    margin: 20,
  },
  capture: { width: "100%", height: 250 },
});
