"use client";
import { useEffect } from "react";
export default function ConfirmEmail() {
  useEffect(() => {
    const fragment=new URLSearchParams(location.hash.slice(1));
    const query=new URLSearchParams(location.search);
    const failed=fragment.has("error")||query.has("error");
    const result=failed?"expired":fragment.has("access_token")?"success":"missing";
    // Supabase a vérifié le lien. Aucun token du fragment n’est conservé ;
    // la connexion au journal demande ensuite le mot de passe de l’utilisateur.
    location.replace("/?confirmation="+result);
  }, []);
  return <main className="auth-page" style={{display:"grid",placeContent:"center",gap:24,textAlign:"center"}}><img src="/brand/edge-logo.svg" alt="EDGE" width={180} height={45} /><p>Retour vers ton journal…</p><a href="/">Revenir à la connexion</a></main>;
}
