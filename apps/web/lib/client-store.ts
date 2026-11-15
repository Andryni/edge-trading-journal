"use client";
import { create } from "zustand";
import { journalSchema, newJournal, type Journal } from "@edge/core";
import {readRemoteJournal,writeRemoteJournal} from "./cloud-client";
type User = { id: string; email: string };
type Saved = { data: Journal; revision: number; dirty: boolean };
type State = {
  user: User | null;
  guest: boolean;
  cloud: boolean;
  enterDemo: () => void;
  data: Journal;
  revision: number;
  dirty: boolean;
  loaded: boolean;
  status: string;
  error: string;
  conflict: Saved | null;
  sequence: number;
  boot: () => Promise<void>;
  login: (email: string, password: string, register: boolean) => Promise<{confirmationRequired:boolean}>;
  logout: () => Promise<void>;
  update: (fn: (j: Journal) => void) => void;
  sync: () => Promise<void>;
  resolve: (keepLocal: boolean) => void;
};
function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("edge-journal-v2", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("records");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function read<T>(key: string) {
  const db = await database();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction("records");
    const q = tx.objectStore("records").get(key);
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => reject(q.error);
    tx.oncomplete = () => db.close();
  });
}
async function write(key: string, value: unknown) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("records", "readwrite");
    tx.objectStore("records").put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
let diskQueue = Promise.resolve();
let syncing = false;
let syncingUser: string | null = null;
function persist() {
  const s = useApp.getState();
  if (!s.user || s.guest) return;
  const key = s.user.id;
  const saved: Saved = { data: s.data, revision: s.revision, dirty: s.dirty };
  diskQueue = diskQueue
    .catch(() => {})
    .then(() => write(key, saved))
    .catch(() => {
      useApp.setState({
        error:
          "Impossible d’enregistrer sur cet appareil. Exporte une sauvegarde avant de fermer.",
      });
    });
}
async function responseJson(res: Response) {
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Requête refusée.");
  return body;
}
async function load(user: User) {
  const local = await read<Saved>(user.id);
  const remote = await readRemoteJournal();
  const remoteData = journalSchema.parse(remote.data);
  if (local?.dirty) {
    useApp.setState({
      data: journalSchema.parse(local.data),
      revision: local.revision,
      dirty: true,
      conflict:
        local.revision !== remote.revision
          ? { data: remoteData, revision: remote.revision, dirty: false }
          : null,
      status:
        local.revision !== remote.revision
          ? "Conflit à résoudre"
          : "Modifications sur cet appareil en attente",
    });
  } else {
    useApp.setState({
      data: remoteData,
      revision: remote.revision,
      dirty: false,
      status: "Journal synchronisé",
    });
  }
  persist();
}
const buildStore = () =>
  create<State>((set, get) => ({
    user: null,
    guest: false,
    cloud: false,
    enterDemo: () => set({user:{id:"demo-browser",email:"demo@edge.local"},guest:true,data:newJournal(true),loaded:true,revision:0,dirty:false,error:"",conflict:null,status:"Démonstration · données fictives"}),
    data: newJournal(),
    revision: 0,
    dirty: false,
    loaded: false,
    status: "Initialisation…",
    error: "",
    conflict: null,
    sequence: 0,
    boot: async () => {
      try {
        const auth = await responseJson(
          await fetch("/api/auth", {
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
          }),
        );
        set({ user: auth.user, cloud: auth.backend === "supabase", guest:false });
        if (auth.user) {
          await write("last-user", auth.user);
          await load(auth.user);
        }
        set({ loaded: true });
      } catch {
        const user = await read<User>("last-user").catch(() => undefined);
        const saved = user
          ? await read<Saved>(user.id).catch(() => undefined)
          : undefined;
        if (user && saved)
          set({
            user,
            data: journalSchema.parse(saved.data),
            revision: saved.revision,
            dirty: saved.dirty,
            loaded: true,
            status: "Hors ligne · copie sur cet appareil",
          });
        else
          set({
            loaded: true,
            error: "Le journal est temporairement indisponible. Vérifie ta connexion et réessaie.",
          });
      }
    },
    login: async (email, password, register) => {
      const body = await responseJson(
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: register ? "register" : "login",
            email,
            password,
          }),
        }),
      );
      if(body.confirmationRequired)return {confirmationRequired:true};
      set({ user: body.user, error: "", loaded: false });
      try {
        await write("last-user", body.user);
        await load(body.user);
      } finally {
        set({ loaded: true });
      }
      return {confirmationRequired:false};
    },
    logout: async () => {
      if(get().guest){set({user:null,guest:false,data:newJournal(),dirty:false,error:"",conflict:null});return;}
      if (get().dirty)
        throw new Error(
          "Synchronise ou exporte les changements avant de te déconnecter.",
        );
      await responseJson(await fetch("/api/auth", { method: "DELETE" }));
      await write("last-user", null);
      set({
        user: null,
        data: newJournal(),
        revision: 0,
        dirty: false,
        status: "Déconnecté",
        conflict: null,
      });
    },
    update: (fn) => {
      try {
        const draft = structuredClone(get().data);
        fn(draft);
        const parsed = journalSchema.parse(draft);
        if (
          new TextEncoder().encode(JSON.stringify(parsed)).byteLength >
          31_500_000
        )
          throw new Error(
            "Le journal dépasse 31,5 Mo. Exporte une archive et réduis les captures avant de continuer.",
          );
        set((s) => ({
          data: parsed,
          dirty: !s.guest,
          error: "",
          sequence: s.sequence + 1,
          status: s.guest ? "Démonstration · modifications temporaires" : "Enregistré sur cet appareil · synchronisation en attente",
        }));
        persist();
      } catch (e) {
        set({ error: e instanceof Error ? e.message : "Données invalides." });
        throw e;
      }
    },
    sync: async () => {
      const s = get();
      if (!s.user || s.guest || !s.dirty || s.conflict || syncing) return;
      syncing = true;
      syncingUser = s.user.id;
      set({ status: "Synchronisation du journal…" });
      try {
        const result = await writeRemoteJournal(s.data,s.revision);
        if (get().user?.id !== syncingUser) return;
        set({
          revision: result.revision,
          data: get().sequence === s.sequence && result.data ? result.data : get().data,
          dirty: get().sequence !== s.sequence,
          status:
            get().sequence === s.sequence
              ? "Journal synchronisé"
              : "Changements suivants en attente",
          error: "",
        });
        persist();
      } catch (e) {
        if(e instanceof Error && e.message === "CONFLICT"){
          const remote=await readRemoteJournal();
          if(get().user?.id !== syncingUser)return;
          set({conflict:{data:journalSchema.parse(remote.data),revision:remote.revision,dirty:false},status:"Conflit : données serveur plus récentes"});
          return;
        }
        set({
          status: "Copie sur cet appareil conservée · synchronisation interrompue",
          error: e instanceof Error ? e.message : "Connexion interrompue.",
        });
      } finally {
        syncing = false;
        syncingUser = null;
      }
    },
    resolve: (keepLocal) => {
      const c = get().conflict;
      if (!c) return;
      set((s) => ({
        data: keepLocal ? s.data : c.data,
        revision: c.revision,
        dirty: keepLocal,
        conflict: null,
        status: keepLocal
          ? "Copie de cet appareil retenue · à synchroniser"
          : "Copie serveur récupérée",
        sequence: s.sequence + 1,
      }));
      persist();
    },
  }));

const storeScope = globalThis as unknown as {
  __edgeAppStore?: ReturnType<typeof buildStore>;
};
export const useApp = storeScope.__edgeAppStore ?? buildStore();
if (process.env.NODE_ENV === "development") storeScope.__edgeAppStore = useApp;
