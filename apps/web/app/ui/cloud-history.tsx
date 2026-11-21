"use client";
import {useState} from "react";
import {useApp} from "../../lib/client-store";
import {listCloudVersions,readCloudVersion} from "../../lib/cloud-client";
import {exportBackup} from "../../lib/files";
import {Panel,Modal} from "./kit";
export default function CloudHistory(){
  const {data,update,cloud,guest}=useApp();
  const [versions,setVersions]=useState<{revision:number;created_at:string}[]|null>(null),[selected,setSelected]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  if(!cloud||guest)return null;
  return <Panel className="settings-cloud"><h2>Historique du journal</h2><p className="muted">Les 20 révisions précédentes synchronisées sont conservées dans ton espace privé. Une restauration crée ensuite une nouvelle révision.</p><button className="btn secondary" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{setVersions(await listCloudVersions());}catch(e){setError(String(e));}finally{setBusy(false);}}}>Afficher les révisions</button>{versions?.length===0&&<p>Aucune révision précédente pour le moment.</p>}{versions?.map(v=><div className="setup-row" key={v.revision}><span>Révision {v.revision} · {new Date(v.created_at).toLocaleString("fr-FR")}</span><button className="text-btn" onClick={()=>setSelected(v.revision)}>Restaurer…</button></div>)}{error&&<p role="alert" className="negative">{error}</p>}{selected!==null&&<Modal title={`Restaurer la révision ${selected}`} onClose={()=>setSelected(null)}><p>Une sauvegarde complète du journal actuel sera téléchargée avant de remplacer la copie locale. Synchronise ensuite cette restauration.</p><button className="btn primary" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{const previous=await readCloudVersion(selected);await exportBackup(data);update(j=>Object.assign(j,previous));setSelected(null);}catch(e){setError(String(e));}finally{setBusy(false);}}}>Sauvegarder puis restaurer</button></Modal>}</Panel>;
}
