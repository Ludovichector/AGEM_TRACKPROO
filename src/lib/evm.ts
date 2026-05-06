// =====================================================
// MOTEUR EVM - Earned Value Management
// Conforme aux TDR §7-9 du projet OBF Siège
// =====================================================

export interface EvmInput {
  pv: bigint;
  ev: bigint;
  ac: bigint;
  bac: bigint;
  physicalProgress: number;
}

export type CpiZone = "GREEN" | "YELLOW" | "PENALTY_2" | "PENALTY_5" | "PENALTY_10" | "NONE";
export type AlertLevel = "NONE" | "INFO" | "WARNING" | "CRITICAL";

export interface EvmResults {
  cpi: number | null;
  spi: number | null;
  cv: bigint;
  sv: bigint;
  eac: bigint | null;
  etc: bigint | null;
  tcpi: number | null;
  cpiZone: CpiZone;
  penaltyPct: number;
  penaltyAmountXOF: bigint;
  alertLevel: AlertLevel;
  alertMessage: string;
}

// Seuils de pénalités contractuelles (TDR §7-9)
const CPI_THRESHOLDS = {
  GREEN: 0.95,
  YELLOW: 0.9,
  PENALTY_2: 0.85,
  PENALTY_5: 0.8,
} as const;

export function computeEvm(input: EvmInput): EvmResults {
  const { pv, ev, ac, bac, physicalProgress: _pp } = input;

  // Indicateurs de base
  const cpi = ac > 0n ? Number(ev) / Number(ac) : null;
  const spi = pv > 0n ? Number(ev) / Number(pv) : null;
  const cv = ev - ac;
  const sv = ev - pv;

  // Prévisions à l'achèvement
  const eac = cpi !== null && cpi > 0 ? BigInt(Math.round(Number(bac) / cpi)) : null;
  const etc = eac !== null ? eac - ac : null;

  // TCPI - To Complete Performance Index
  const tcpi =
    bac > ac
      ? (Number(bac) - Number(ev)) / (Number(bac) - Number(ac))
      : null;

  // Zone CPI et pénalités
  let cpiZone: CpiZone = "NONE";
  let penaltyPct = 0;

  if (cpi !== null) {
    if (cpi >= CPI_THRESHOLDS.GREEN) {
      cpiZone = "GREEN";
      penaltyPct = 0;
    } else if (cpi >= CPI_THRESHOLDS.YELLOW) {
      cpiZone = "YELLOW";
      penaltyPct = 0;
    } else if (cpi >= CPI_THRESHOLDS.PENALTY_2) {
      cpiZone = "PENALTY_2";
      penaltyPct = 2;
    } else if (cpi >= CPI_THRESHOLDS.PENALTY_5) {
      cpiZone = "PENALTY_5";
      penaltyPct = 5;
    } else {
      cpiZone = "PENALTY_10";
      penaltyPct = 10;
    }
  }

  const penaltyAmountXOF = BigInt(Math.round((Number(bac) * penaltyPct) / 100));

  // Niveau d'alerte
  let alertLevel: AlertLevel = "NONE";
  let alertMessage = "";

  if (cpi !== null) {
    if (cpi < 0.8) {
      alertLevel = "CRITICAL";
      alertMessage = `ALERTE CRITIQUE - CPI=${cpi.toFixed(3)} - Pénalité 10% - Réunion de crise Direction Générale requise immédiatement`;
    } else if (cpi < 0.85) {
      alertLevel = "CRITICAL";
      alertMessage = `ALERTE ROUGE - CPI=${cpi.toFixed(3)} - Pénalité 5% - Mobilisation d'urgence + CoPil requis`;
    } else if (cpi < 0.9) {
      alertLevel = "WARNING";
      alertMessage = `ALERTE ORANGE - CPI=${cpi.toFixed(3)} - Pénalité 2% - Note d'alerte au DG requise`;
    } else if (cpi < 0.95) {
      alertLevel = "INFO";
      alertMessage = `SURVEILLANCE - CPI=${cpi.toFixed(3)} - Zone jaune - Plan d'action recommandé`;
    } else {
      alertLevel = "NONE";
      alertMessage = `Zone verte - CPI=${cpi.toFixed(3)} - Projet sous contrôle`;
    }
  }

  if (spi !== null && spi < 0.9 && alertLevel !== "CRITICAL") {
    alertLevel = alertLevel === "NONE" ? "INFO" : alertLevel;
    alertMessage += alertMessage
      ? ` | Retard planning : SPI=${spi.toFixed(3)}`
      : `Retard planning significatif - SPI=${spi.toFixed(3)}`;
  }

  return {
    cpi,
    spi,
    cv,
    sv,
    eac,
    etc,
    tcpi,
    cpiZone,
    penaltyPct,
    penaltyAmountXOF,
    alertLevel,
    alertMessage,
  };
}

// Couleur associée à une zone CPI
export function getCpiZoneColor(zone: CpiZone): string {
  const colors: Record<CpiZone, string> = {
    GREEN: "#10B981",
    YELLOW: "#F59E0B",
    PENALTY_2: "#F97316",
    PENALTY_5: "#EF4444",
    PENALTY_10: "#7F1D1D",
    NONE: "#6B7280",
  };
  return colors[zone];
}

export function getCpiZoneLabel(zone: CpiZone): string {
  const labels: Record<CpiZone, string> = {
    GREEN: "Zone Verte",
    YELLOW: "Zone Jaune",
    PENALTY_2: "Pénalité 2%",
    PENALTY_5: "Pénalité 5%",
    PENALTY_10: "Pénalité 10%",
    NONE: "-",
  };
  return labels[zone];
}
