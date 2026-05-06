// =====================================================
// SYSTÈME DE PERMISSIONS - AGEM TrackPro
// Matrice rôles × modules × actions
// =====================================================

import { Role } from "@prisma/client";

export type Module =
  | "dashboard"
  | "evm"
  | "legal"
  | "risks"
  | "planning"
  | "tasks"
  | "rse"
  | "chat"
  | "documents"
  | "notifications"
  | "admin"
  | "profile"
  | "raci"
  | "accounting";

export type Action = "view" | "create" | "edit" | "delete" | "approve" | "export";

type PermissionMap = Partial<Record<Module, Partial<Record<Action, Role[]>>>>;

const ALL_ROLES: Role[] = [
  "SUPER_ADMIN",
  "MOA_DG",
  "MOA_COPIL",
  "AMOA_CHEF",
  "AMOA_INGENIEUR",
  "AMOA_JURISTE",
  "AMOA_ECONOMISTE",
  "AMOA_RSE",
  "MOE",
  "BCT",
  "ENTREPRISE",
  "OBSERVATEUR",
];

const AMOA_ROLES: Role[] = [
  "SUPER_ADMIN",
  "AMOA_CHEF",
  "AMOA_INGENIEUR",
  "AMOA_JURISTE",
  "AMOA_ECONOMISTE",
  "AMOA_RSE",
];

const MOA_ROLES: Role[] = ["SUPER_ADMIN", "MOA_DG", "MOA_COPIL"];

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "AMOA_CHEF"];

export const PERMISSIONS: PermissionMap = {
  dashboard: {
    view: ALL_ROLES,
  },

  accounting: {
    view: ALL_ROLES.filter((r) => r !== "ENTREPRISE"),
    create: [...AMOA_ROLES, "MOE"],
    edit: ["SUPER_ADMIN", "AMOA_CHEF", "AMOA_ECONOMISTE"],
    delete: ["SUPER_ADMIN"],
    approve: ["SUPER_ADMIN", "MOA_DG"],
    export: ["SUPER_ADMIN", "AMOA_CHEF", "AMOA_ECONOMISTE", "MOA_DG", "MOA_COPIL"],
  },

  legal: {
    view: ALL_ROLES.filter((r) => r !== "ENTREPRISE"),
    create: ["SUPER_ADMIN", "AMOA_CHEF", "AMOA_JURISTE"],
    edit: ["SUPER_ADMIN", "AMOA_CHEF", "AMOA_JURISTE"],
    delete: ["SUPER_ADMIN"],
    approve: ["SUPER_ADMIN", "MOA_DG", "MOA_COPIL"],
    export: ADMIN_ROLES,
  },

  risks: {
    view: ALL_ROLES.filter((r) => r !== "ENTREPRISE"),
    create: [...AMOA_ROLES],
    edit: [...AMOA_ROLES],
    delete: ["SUPER_ADMIN", "AMOA_CHEF"],
    approve: ["SUPER_ADMIN", "AMOA_CHEF"],
    export: ADMIN_ROLES,
  },

  planning: {
    view: ALL_ROLES,
    create: ADMIN_ROLES,
    edit: ADMIN_ROLES,
    delete: ["SUPER_ADMIN"],
    approve: [...MOA_ROLES, "AMOA_CHEF"],
    export: ALL_ROLES.filter((r) => r !== "OBSERVATEUR"),
  },

  tasks: {
    view: ALL_ROLES,
    create: ALL_ROLES.filter((r) => r !== "OBSERVATEUR" && r !== "MOA_DG"),
    edit: [...AMOA_ROLES, "MOE", "ENTREPRISE"],
    delete: ADMIN_ROLES,
    approve: ADMIN_ROLES,
    export: ADMIN_ROLES,
  },

  rse: {
    view: ALL_ROLES.filter((r) => r !== "ENTREPRISE"),
    create: ["SUPER_ADMIN", "AMOA_CHEF", "AMOA_RSE"],
    edit: ["SUPER_ADMIN", "AMOA_CHEF", "AMOA_RSE"],
    delete: ["SUPER_ADMIN"],
    approve: [...MOA_ROLES, "AMOA_CHEF"],
    export: ADMIN_ROLES,
  },

  chat: {
    view: ALL_ROLES,
    create: ALL_ROLES.filter((r) => r !== "OBSERVATEUR"),
    edit: ALL_ROLES.filter((r) => r !== "OBSERVATEUR"),
    delete: ADMIN_ROLES,
    approve: [],
    export: [],
  },

  documents: {
    view: ALL_ROLES,
    create: ALL_ROLES.filter((r) => r !== "OBSERVATEUR"),
    edit: [...AMOA_ROLES, "MOE", "BCT"],
    delete: ADMIN_ROLES,
    approve: ADMIN_ROLES,
    export: ALL_ROLES.filter((r) => r !== "OBSERVATEUR"),
  },

  notifications: {
    view: ALL_ROLES,
    create: [...AMOA_ROLES, "MOE"],
    edit: ALL_ROLES,
    delete: ALL_ROLES,
    approve: [],
    export: [],
  },

  admin: {
    view: ["SUPER_ADMIN"],
    create: ["SUPER_ADMIN"],
    edit: ["SUPER_ADMIN"],
    delete: ["SUPER_ADMIN"],
    approve: ["SUPER_ADMIN"],
    export: ["SUPER_ADMIN"],
  },

  profile: {
    view: ALL_ROLES,
    create: ALL_ROLES,
    edit: ALL_ROLES,
    delete: ["SUPER_ADMIN"],
    approve: [],
    export: [],
  },

  raci: {
    view: ALL_ROLES,
    create: ADMIN_ROLES,
    edit: ADMIN_ROLES,
    delete: ["SUPER_ADMIN"],
    approve: [],
    export: ALL_ROLES,
  },
};

// Vérifie si un rôle a la permission pour un module + action donnés
export function hasPermission(role: Role, module: Module, action: Action): boolean {
  const allowedRoles = PERMISSIONS[module]?.[action] ?? [];
  return allowedRoles.includes(role);
}

// Récupère toutes les actions autorisées pour un rôle + module
export function getAllowedActions(role: Role, module: Module): Action[] {
  const actions: Action[] = ["view", "create", "edit", "delete", "approve", "export"];
  return actions.filter((action) => hasPermission(role, module, action));
}

// Label affiché pour chaque rôle
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrateur",
  MOA_DG: "Direction Générale Orange BF",
  MOA_COPIL: "Comité de Pilotage Orange",
  AMOA_CHEF: "Chef de Projet AMOA",
  AMOA_INGENIEUR: "Ingénieur AMOA",
  AMOA_JURISTE: "Juriste AMOA",
  AMOA_ECONOMISTE: "Économiste AMOA",
  AMOA_RSE: "Responsable RSE AMOA",
  MOE: "Maîtrise d'Œuvre",
  BCT: "Bureau de Contrôle Technique",
  ENTREPRISE: "Entreprise de travaux",
  OBSERVATEUR: "Observateur",
};

export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "#C9A961",
  MOA_DG: "#FF7900",
  MOA_COPIL: "#E66A00",
  AMOA_CHEF: "#1A1A1A",
  AMOA_INGENIEUR: "#2D2D2D",
  AMOA_JURISTE: "#3B82F6",
  AMOA_ECONOMISTE: "#10B981",
  AMOA_RSE: "#8B5CF6",
  MOE: "#F59E0B",
  BCT: "#6B7280",
  ENTREPRISE: "#EF4444",
  OBSERVATEUR: "#A8A29E",
};

// Modules visibles dans la navigation selon rôle
export function getNavModules(role: Role): Module[] {
  const allModules: Module[] = [
    "dashboard",
    "accounting",
    "legal",
    "risks",
    "planning",
    "tasks",
    "rse",
    "chat",
    "documents",
    "raci",
    "admin",
  ];
  return allModules.filter((mod) => hasPermission(role, mod, "view"));
}
