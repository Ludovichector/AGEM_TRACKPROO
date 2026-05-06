// =====================================================
// MOTEUR LOI 022-2025
// Délai légal de dépôt : 30 juin 2026
// Loi N° 022-2025/ALT du 29 décembre 2025
// =====================================================

export type LegalAlertLevel = "NORMAL" | "SURVEILLANCE" | "ALERT_ORANGE" | "ALERT_RED" | "OVERDUE";

export interface LegalCountdown {
  daysRemaining: number;
  totalLegalDays: number;
  progressionPct: number;
  alertLevel: LegalAlertLevel;
  alertLabel: string;
  alertColor: string;
  deadline: Date;
  lawEnactmentDate: Date;
}

export interface Construction36Months {
  isStarted: boolean;
  startDate: Date | null;
  monthsElapsed: number;
  monthsRemaining: number;
  constructionProgressVsTimePct: number;
  deadlineDate: Date | null;
}

// Dates clés de la Loi 022-2025
const LAW_ENACTMENT_DATE = new Date("2025-12-29");
const FILING_DEADLINE = new Date("2026-06-30");
const TOTAL_CONSTRUCTION_MONTHS = 36;

export function computeLegalCountdown(referenceDate: Date = new Date()): LegalCountdown {
  const deadline = new Date(FILING_DEADLINE);
  const lawDate = new Date(LAW_ENACTMENT_DATE);

  const totalLegalMs = deadline.getTime() - lawDate.getTime();
  const totalLegalDays = Math.floor(totalLegalMs / 86400000);

  const remainingMs = deadline.getTime() - referenceDate.getTime();
  const daysRemaining = Math.floor(remainingMs / 86400000);

  const elapsedDays = totalLegalDays - daysRemaining;
  const progressionPct = Math.min(100, Math.max(0, (elapsedDays / totalLegalDays) * 100));

  let alertLevel: LegalAlertLevel;
  let alertLabel: string;
  let alertColor: string;

  if (daysRemaining <= 0) {
    alertLevel = "OVERDUE";
    alertLabel = "DEPASSEMENT LEGAL";
    alertColor = "#7F1D1D"; // Dark Red remains for overdue
  } else if (daysRemaining < 15) {
    alertLevel = "ALERT_RED";
    alertLabel = "ALERTE ROUGE - Escalade DG immédiate";
    alertColor = "#EF4444"; // Red remains for critical
  } else if (daysRemaining < 30) {
    alertLevel = "ALERT_ORANGE";
    alertLabel = "Alerte - Revue à déclencher";
    alertColor = "var(--agem-gold-dark)"; // AGEM Gold Dark instead of Orange
  } else if (daysRemaining <= 60) {
    alertLevel = "SURVEILLANCE";
    alertLabel = "Surveillance renforcée";
    alertColor = "var(--agem-gold)"; // AGEM Gold instead of Amber
  } else {
    alertLevel = "NORMAL";
    alertLabel = "Normal";
    alertColor = "#10B981"; // Success remains Green
  }

  return {
    daysRemaining,
    totalLegalDays,
    progressionPct,
    alertLevel,
    alertLabel,
    alertColor,
    deadline,
    lawEnactmentDate: lawDate,
  };
}

export function computeConstruction36Months(
  isStarted: boolean,
  startDate: Date | null,
  referenceDate: Date = new Date()
): Construction36Months {
  if (!isStarted || !startDate) {
    return {
      isStarted: false,
      startDate: null,
      monthsElapsed: 0,
      monthsRemaining: TOTAL_CONSTRUCTION_MONTHS,
      constructionProgressVsTimePct: 0,
      deadlineDate: null,
    };
  }

  const deadlineDate = new Date(startDate);
  deadlineDate.setMonth(deadlineDate.getMonth() + TOTAL_CONSTRUCTION_MONTHS);

  const totalMs = deadlineDate.getTime() - startDate.getTime();
  const elapsedMs = referenceDate.getTime() - startDate.getTime();
  const elapsedMonths = Math.max(0, elapsedMs / (totalMs / TOTAL_CONSTRUCTION_MONTHS));
  const monthsElapsed = Math.min(TOTAL_CONSTRUCTION_MONTHS, Math.floor(elapsedMonths));
  const monthsRemaining = Math.max(0, TOTAL_CONSTRUCTION_MONTHS - monthsElapsed);
  const constructionProgressVsTimePct = Math.min(100, (monthsElapsed / TOTAL_CONSTRUCTION_MONTHS) * 100);

  return {
    isStarted: true,
    startDate,
    monthsElapsed,
    monthsRemaining,
    constructionProgressVsTimePct,
    deadlineDate,
  };
}
