import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// =====================================================
// FCFA - Franc CFA d'Afrique de l'Ouest (XOF)
// =====================================================

export function formatXOF(amount: bigint | number, mode: "full" | "compact" = "full"): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;

  if (mode === "compact") {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1).replace(".", ",")} Mds FCFA`;
    }
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1).replace(".", ",")} M FCFA`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(0)} K FCFA`;
    }
  }

  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)} FCFA`;
}

// =====================================================
// Dates - format DD/MM/YYYY
// =====================================================

export function formatDate(date: Date | string, fmt = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: fr });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return formatDate(d);
}

// =====================================================
// Mois projet - "M12 (Mars 2027)"
// =====================================================

export function formatMonth(monthNumber: number, projectStartDate?: Date): string {
  if (!projectStartDate) return `M${monthNumber}`;

  const date = new Date(projectStartDate);
  date.setMonth(date.getMonth() + monthNumber - 1);
  const monthName = format(date, "MMMM yyyy", { locale: fr });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `M${monthNumber} (${capitalized})`;
}

// =====================================================
// Durées
// =====================================================

export function formatDuration(days: number): string {
  if (days < 0) return "Dépassé";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  if (days < 30) return `${days} jours`;
  if (days < 365) return `${Math.floor(days / 30)} mois`;
  return `${(days / 365).toFixed(1)} ans`;
}

// =====================================================
// Pourcentages
// =====================================================

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// =====================================================
// Taille de fichier
// =====================================================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}
