"use client";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useApp } from "../../lib/client-store";
import LoginChart from "./login-chart";

export default function Login() {
  const { login, enterDemo, error: serverError } = useApp();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [resendAt, setResendAt] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fragment = new URLSearchParams(location.hash.slice(1));
    const result = params.get("confirmation");
    if (result === "success" || fragment.has("access_token")) setNotice("Ton adresse email est confirmée. Connecte-toi pour ouvrir ton journal.");
    if (result === "expired" || fragment.has("error")) setError("Ce lien de confirmation est expiré ou a déjà été utilisé. Tu peux te connecter si ton adresse est confirmée, ou demander un nouveau lien.");
    if (result || fragment.has("access_token") || fragment.has("error")) history.replaceState(null, "", location.pathname);
  }, []);

  function changeMode(value: boolean) {
    setRegister(value); setError(""); setNotice(""); setConfirmation(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (register && password !== form.get("confirmPassword")) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    try {
      const result = await login(email, password, register);
      if (result.confirmationRequired) { setConfirmation(true); setResendAt(Date.now() + 60000); }
    } catch (e) { setError(e instanceof Error ? e.message : "Connexion impossible. Réessaie dans un instant."); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (!email) { setError("Renseigne ton adresse email pour recevoir un nouveau lien."); return; }
    if (Date.now() < resendAt) { setError("Patiente une minute entre deux demandes de confirmation."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resend", email }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Le message n’a pas pu être envoyé.");
      setNotice("Si cette adresse attend une confirmation, un nouveau lien vient de lui être envoyé."); setResendAt(Date.now() + 60000);
    } catch (e) { setError(e instanceof Error ? e.message : "Envoi temporairement indisponible."); }
    finally { setBusy(false); }
  }
  return (
    <main className="auth-page">
      <div className="auth-ambient" aria-hidden="true" />
      <header className="auth-header">
        <a href="/" className="auth-brand" aria-label="EDGE — accueil"><img src="/brand/edge-logo.svg" alt="EDGE" width={180} height={45} /><span>TRADING JOURNAL</span></a>
        <button className="auth-demo-link" type="button" onClick={enterDemo}>Explorer la démo <ArrowUpRight size={16} /></button>
      </header>
      <div className="auth-layout">
        <section className="auth-story" aria-labelledby="auth-headline">
          <p className="auth-overline"><span /> POUR LES TRADERS QUI PRENNENT DU RECUL</p>
          <h1 id="auth-headline">Le marché bouge.<br /><span>Garde ton cap.</span></h1>
          <p className="auth-description">Derrière chaque trade, une décision.<br />Retrouve tes repères, comprends tes habitudes<br className="auth-desktop-break" /> et construis ton propre edge.</p>
          <LoginChart />
          <div className="auth-pillars"><span><b>01</b> Ton risque.</span><span><b>02</b> Tes décisions.</span><span><b>03</b> Ta progression.</span></div>
        </section>
        <section className="auth-form-card" aria-labelledby="auth-form-title">
          <div className="auth-card-top"><span className="auth-card-symbol"><LockKeyhole size={20} /></span><span>TON ESPACE, TON EDGE.</span><i /></div>
          {confirmation ? (
            <div className="auth-confirmation">
              <span className="auth-mail-icon"><Mail size={28} /></span>
              <h2 id="auth-form-title">Vérifie ta boîte mail.</h2>
              <p>Un lien de confirmation a été demandé pour <strong>{email}</strong>. Ouvre le message, confirme ton adresse, puis reviens te connecter.</p>
              <p className="auth-form-hint">Pense à vérifier les courriers indésirables. Utilise le message le plus récent.</p>
              <button className="auth-submit" type="button" onClick={() => changeMode(false)}>Revenir à la connexion <ArrowRight size={17} /></button>
              <button className="auth-text-button" type="button" disabled={busy} onClick={() => void resend()}>Renvoyer le lien de confirmation</button>
            </div>
          ) : (
            <>
              <div className="auth-mode-tabs" role="tablist" aria-label="Accès à ton journal"><button id="auth-login-tab" type="button" role="tab" aria-selected={!register} aria-controls="auth-form-panel" onClick={() => changeMode(false)}>Connexion</button><button id="auth-register-tab" type="button" role="tab" aria-selected={register} aria-controls="auth-form-panel" onClick={() => changeMode(true)}>Créer un compte</button></div>
              <div id="auth-form-panel" role="tabpanel" aria-labelledby={register ? "auth-register-tab" : "auth-login-tab"}>
                <h2 id="auth-form-title">{register ? "Créer mon journal" : "Connexion"}</h2>
                <p className="auth-form-description">{register ? "Une nouvelle page pour ton trading. Ton journal commence ici." : "Reprends le fil de ton trading. Ton journal t’attend."}</p>
                <form onSubmit={(e) => void submit(e)}>
                  <label className="auth-field"><span>Adresse email</span><div className="auth-input-wrap"><Mail size={17} aria-hidden="true" /><input name="email" type="email" autoComplete="username" placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} /></div></label>
                  <label className="auth-field"><span>Mot de passe <small>{register ? "10 caractères minimum" : ""}</small></span><div className="auth-input-wrap"><LockKeyhole size={17} aria-hidden="true" /><input name="password" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} placeholder={register ? "Crée ton mot de passe" : "Ton mot de passe"} minLength={10} maxLength={200} required /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
                  {register && <label className="auth-field"><span>Confirmer le mot de passe</span><div className="auth-input-wrap"><Check size={17} aria-hidden="true" /><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Une seconde fois, pour vérifier" minLength={10} maxLength={200} required /></div></label>}
                  <button className="auth-submit" disabled={busy}>{busy ? "Un instant…" : register ? "Créer mon espace" : "Ouvrir mon cockpit"}<ArrowRight size={18} /></button>
                </form>
                {register ? <p className="auth-form-hint">Tu recevras un email pour confirmer ton adresse avant ta première connexion.</p> : <button className="auth-text-button" type="button" disabled={busy} onClick={() => void resend()}>Renvoyer un email de confirmation</button>}
              </div>
            </>
          )}
          {(error || serverError) && <p className="auth-feedback error" role="alert">{error || serverError}</p>}
          {notice && <p className="auth-feedback success" role="status"><Check size={16} />{notice}</p>}
          <div className="auth-card-footer"><ShieldCheck size={16} /><span>Un espace personnel. Accessible sur tes appareils.</span></div>
        </section>
      </div>
      <footer className="auth-footer"><span>EDGE / PREPARE. EXECUTE. REFLECT.</span><span>Ta discipline fait la différence.</span></footer>
    </main>
  );
}
