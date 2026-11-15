/** Le français reste la langue complète. Le dictionnaire prépare la localisation sans traduire les données de trading. */
export const messages = {
  fr: {
    save: "Enregistrer",
    cancel: "Annuler",
    journal: "Journal",
    newTrade: "Nouveau trade",
    offline: "Hors ligne",
  },
  en: {
    save: "Save",
    cancel: "Cancel",
    journal: "Journal",
    newTrade: "New trade",
    offline: "Offline",
  },
} as const;
export function translate(
  locale: keyof typeof messages,
  key: keyof typeof messages.fr,
) {
  return messages[locale][key];
}
