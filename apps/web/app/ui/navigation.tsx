"use client";
import {
  BookOpen,
  ChartNoAxesCombined,
  ClipboardCheck,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type NavigationGroup = {
  view: string;
  label: string;
  icon: LucideIcon;
  screens: string[];
};
export const NAVIGATION: NavigationGroup[] = [
  {
    view: "Cockpit",
    label: "Vue d’ensemble",
    icon: LayoutDashboard,
    screens: ["Cockpit"],
  },
  {
    view: "Journal",
    label: "Journal",
    icon: BookOpen,
    screens: ["Journal", "Calendrier", "Import"],
  },
  {
    view: "Analytiques",
    label: "Analyses",
    icon: ChartNoAxesCombined,
    screens: ["Analytiques", "Leak Finder", "Coach", "Rapports"],
  },
  {
    view: "Plan & revue",
    label: "Préparation",
    icon: ClipboardCheck,
    screens: ["Plan & revue", "Playbook", "Objectifs", "Calculateur"],
  },
  {
    view: "Comptes",
    label: "Comptes",
    icon: ShieldCheck,
    screens: ["Comptes"],
  },
];
export const screenLabel = (view: string) =>
  view === "Cockpit"
    ? "Vue d’ensemble"
    : view === "Analytiques"
      ? "Performance"
      : view;
export const navigationGroup = (view: string) =>
  NAVIGATION.find((group) => group.screens.includes(view));

export function PrimaryNavigation({
  view,
  onNavigate,
}: {
  view: string;
  onNavigate: (view: string) => void;
}) {
  return (
    <nav aria-label="Navigation principale">
      <span className="navigation-caption">ESPACE DE TRAVAIL</span>
      {NAVIGATION.map((group) => (
        <button
          key={group.view}
          type="button"
          className={
            "nav-item " + (group.screens.includes(view) ? "active" : "")
          }
          aria-current={group.screens.includes(view) ? "page" : undefined}
          onClick={() => onNavigate(group.view)}
        >
          <group.icon size={18} aria-hidden="true" />
          <span>{group.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function SectionNavigation({
  view,
  onNavigate,
}: {
  view: string;
  onNavigate: (view: string) => void;
}) {
  const group = navigationGroup(view);
  if (!group || group.screens.length < 2) return null;
  return (
    <nav
      className="section-navigation"
      aria-label={"Sections · " + group.label}
    >
      {group.screens.map((screen) => (
        <button
          key={screen}
          type="button"
          aria-current={view === screen ? "page" : undefined}
          onClick={() => onNavigate(screen)}
        >
          {screenLabel(screen)}
        </button>
      ))}
    </nav>
  );
}
