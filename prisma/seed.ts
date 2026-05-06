// =====================================================
// SEED - AGEM TrackPro - Données de démonstration
// Projet OBF-SIEGE-2026 - 20 Mds FCFA - 67 mois
// =====================================================

import { PrismaClient, Role, LegalActionStatus, EligibilityStatus, RiskStatus,
  MilestoneCriticality, MilestoneStatus, TaskPriority, NotificationType,
  CertificationStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Nettoyage de la base de données...");

  // Ordre de suppression pour respecter les FK
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.taskWatcher.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.rseIndicator.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.raciItem.deleteMany();
  await prisma.riskUpdate.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.evmMonthlyEntry.deleteMany();
  await prisma.legalAction.deleteMany();
  await prisma.fiscalAdvantage.deleteMany();
  await prisma.report.deleteMany();
  await prisma.clientReserve.deleteMany();
  await prisma.clientValidation.deleteMany();
  await prisma.photoAnnotation.deleteMany();
  await prisma.sitePhoto.deleteMany();
  await prisma.projectHealthScore.deleteMany();
  await prisma.legalTracker.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSetting.deleteMany();

  console.log("Création des utilisateurs de démonstration...");
  const PASSWORD_HASH = await bcrypt.hash("Demo2026!", 12);

  const users = await Promise.all([
    prisma.user.create({ data: {
      email: "superadmin@agem.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Administrateur Système",
      role: Role.SUPER_ADMIN,
      organization: "AGEM-Développement",
      jobTitle: "Administrateur Plateforme",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "pierre.dakissaga@agem.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Pierre Claver DAKISSAGA",
      role: Role.AMOA_CHEF,
      organization: "AGEM-Développement",
      jobTitle: "Chef de Projet AMOA - Architecte-Urbaniste agréé",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "juriste@agem.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Aminata SAWADOGO",
      role: Role.AMOA_JURISTE,
      organization: "AGEM-Développement",
      jobTitle: "Juriste AMOA",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "economiste@agem.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Dramane OUEDRAOGO",
      role: Role.AMOA_ECONOMISTE,
      organization: "AGEM-Développement",
      jobTitle: "Économiste de la Construction AMOA",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "rse@agem.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Fatimata TRAORE",
      role: Role.AMOA_RSE,
      organization: "AGEM-Développement",
      jobTitle: "Responsable RSE & Développement Durable",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "ingenieur@agem.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Hamidou ZOUNGRANA",
      role: Role.AMOA_INGENIEUR,
      organization: "AGEM-Développement",
      jobTitle: "Ingénieur AMOA - Génie Civil",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "dg@orange.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Direction Générale Orange BF",
      role: Role.MOA_DG,
      organization: "Orange Burkina Faso S.A",
      jobTitle: "Directeur Général",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "copil@orange.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Comité de Pilotage",
      role: Role.MOA_COPIL,
      organization: "Orange Burkina Faso S.A",
      jobTitle: "Membre Comité de Pilotage",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "moe@partner.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Architecte MOE",
      role: Role.MOE,
      organization: "Cabinet Architecture Burkina",
      jobTitle: "Architecte Maître d'Œuvre",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "bct@partner.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Contrôleur Technique BCT",
      role: Role.BCT,
      organization: "Bureau de Contrôle Technique BF",
      jobTitle: "Contrôleur Technique Senior",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "entreprise@partner.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Responsable Travaux",
      role: Role.ENTREPRISE,
      organization: "BTP Burkina Construction S.A",
      jobTitle: "Directeur de Chantier",
      isActive: true,
    }}),
    prisma.user.create({ data: {
      email: "observateur@orange.bf",
      passwordHash: PASSWORD_HASH,
      fullName: "Observateur Interne",
      role: Role.OBSERVATEUR,
      organization: "Orange Money Burkina Faso S.A",
      jobTitle: "Contrôleur Interne",
      isActive: true,
    }}),
  ]);

  const [superAdmin, chefProjet, juriste, economiste, rse, ingenieur, dgOrange, copil, moe, bct, entreprise, observateur] = users;

  console.log("Création du projet OBF-SIEGE-2026...");
  const project = await prisma.project.create({
    data: {
      code: "OBF-SIEGE-2026",
      name: "Nouveau Siège Social Orange Burkina Faso - Immeuble IGH R+7",
      client: "Orange Burkina Faso S.A & Orange Money Burkina Faso S.A",
      totalBudgetXOF: BigInt(20_000_000_000),
      startDate: new Date("2026-03-23"),
      durationMonths: 67,
      status: "ACTIVE",
    },
  });

  console.log("Création du tracker Loi 022-2025...");
  await prisma.legalTracker.create({
    data: {
      projectId: project.id,
      filingDeadline: new Date("2026-06-30"),
      dossierCompletenessPct: 45.0,
      authorizationsObtained: 2,
      authorizationsRequired: 6,
      fiscalDossiersDeposited: 0,
      fiscalDossiersTotal: 5,
      counter36MonthsStarted: false,
    },
  });

  console.log("Création des 6 phases du projet...");
  const phases = await Promise.all([
    prisma.phase.create({ data: {
      projectId: project.id,
      number: 1, name: "Programmation & Dossier Loi 022-2025",
      startMonth: 1, endMonth: 1, durationMonths: 1,
      description: "Élaboration du programme architectural, dépôt dossier Loi 022-2025",
      progressPct: 60,
    }}),
    prisma.phase.create({ data: {
      projectId: project.id,
      number: 2, name: "Sélection de la Maîtrise d'Œuvre",
      startMonth: 2, endMonth: 3, durationMonths: 2,
      description: "Appel d'offres, sélection et notification du MOE",
      progressPct: 20,
    }}),
    prisma.phase.create({ data: {
      projectId: project.id,
      number: 3, name: "Études APS / APD / PRO / DCE",
      startMonth: 4, endMonth: 6, durationMonths: 3,
      description: "Avant-Projet Sommaire, Détaillé, Projet, Dossier de Consultation des Entreprises",
      progressPct: 0,
    }}),
    prisma.phase.create({ data: {
      projectId: project.id,
      number: 4, name: "Consultation & Attribution des Marchés Travaux",
      startMonth: 7, endMonth: 7, durationMonths: 1,
      description: "DAO travaux, dépouillement, attribution marchés, dossiers avantages fiscaux DGI",
      progressPct: 0,
    }}),
    prisma.phase.create({ data: {
      projectId: project.id,
      number: 5, name: "Travaux de Construction & Mise en Service",
      startMonth: 8, endMonth: 55, durationMonths: 48,
      description: "Exécution des travaux IGH R+7 + sous-sol + RDC + VRD, commissionnement",
      progressPct: 0,
    }}),
    prisma.phase.create({ data: {
      projectId: project.id,
      number: 6, name: "Garantie de Parfait Achèvement (GPA)",
      startMonth: 56, endMonth: 67, durationMonths: 12,
      description: "Suivi GPA, levée des réserves, réception définitive, bilan Loi 022-2025",
      progressPct: 0,
    }}),
  ]);

  console.log("Création des 11 jalons critiques...");
  const milestonesData = [
    { phaseIdx: 0, monthNumber: 1, title: "Validation CoPil : Programme + Budget ±20% - Dépôt dossier Loi 022-2025", criticality: MilestoneCriticality.LEGAL_ABSOLUTE, validationCriteria: "PV de validation du CoPil + accusé de réception du dossier par les autorités compétentes", status: MilestoneStatus.IN_PROGRESS },
    { phaseIdx: 1, monthNumber: 3, title: "Notification marché MOE validée par CoPil", criticality: MilestoneCriticality.CRITICAL, validationCriteria: "Lettre de notification signée et enregistrée AMOA", status: MilestoneStatus.PENDING },
    { phaseIdx: 2, monthNumber: 4, title: "Approbation Loi 022-2025 → Démarrage compteur 36 mois", criticality: MilestoneCriticality.LEGAL, validationCriteria: "Arrêté d'approbation reçu - activation du compteur 36 mois dans la plateforme", status: MilestoneStatus.PENDING },
    { phaseIdx: 2, monthNumber: 5, title: "Visa APD + Value Engineering VE#1 réalisé", criticality: MilestoneCriticality.KEY, validationCriteria: "Rapport VE#1 validé par AMOA - économies documentées", status: MilestoneStatus.PENDING },
    { phaseIdx: 2, monthNumber: 6, title: "Visa PRO / DCE - Permis de construire obtenu", criticality: MilestoneCriticality.CRITICAL, validationCriteria: "Documents visés par BCT + Permis de construire délivré par la mairie", status: MilestoneStatus.PENDING },
    { phaseIdx: 3, monthNumber: 7, title: "Attribution marchés travaux - Dossiers avantages fiscaux DGI déposés", criticality: MilestoneCriticality.CRITICAL, validationCriteria: "PV d'attribution + récépissés DGI pour les 5 dossiers d'avantages fiscaux", status: MilestoneStatus.PENDING },
    { phaseIdx: 4, monthNumber: 12, title: "Levée des fondations spéciales IGH", criticality: MilestoneCriticality.CRITICAL, validationCriteria: "PV de réception des fondations spéciales - BCT + AMOA + MOE", status: MilestoneStatus.PENDING },
    { phaseIdx: 4, monthNumber: 43, title: "Essais SSI / CVC / électricité", criticality: MilestoneCriticality.CRITICAL, validationCriteria: "Rapports d'essais validés par BCT - conformité réglementaire IGH", status: MilestoneStatus.PENDING },
    { phaseIdx: 4, monthNumber: 55, title: "Réception provisoire + DOE + Transfert exploitation", criticality: MilestoneCriticality.CRITICAL, validationCriteria: "PV de réception provisoire signé - DOE complet remis - Clés transfert exploitation", status: MilestoneStatus.PENDING },
    { phaseIdx: 5, monthNumber: 60, title: "80% des réserves GPA levées", criticality: MilestoneCriticality.MONITORING, validationCriteria: "Rapport de levée des réserves avec % documenté", status: MilestoneStatus.PENDING },
    { phaseIdx: 5, monthNumber: 67, title: "Réception définitive + Bilan GPA + Clôture Loi 022-2025", criticality: MilestoneCriticality.CRITICAL, validationCriteria: "PV réception définitive + Bilan GPA + Rapport final Loi 022-2025", status: MilestoneStatus.PENDING },
  ];

  for (const ms of milestonesData) {
    await prisma.milestone.create({
      data: {
        phaseId: phases[ms.phaseIdx].id,
        monthNumber: ms.monthNumber,
        title: ms.title,
        criticality: ms.criticality,
        validationCriteria: ms.validationCriteria,
        status: ms.status,
      },
    });
  }

  console.log("Création des 16 actions Loi 022-2025...");
  const legalActions = [
    { title: "Audit réglementaire initial + liste documentaire", phase: "Phase 1", deadline: "Sem. 1", responsible: "AMOA", status: LegalActionStatus.COMPLETED },
    { title: "Collecte des pièces OBF/OMBF (titre foncier, CA, etc.)", phase: "Phase 1", deadline: "Sem. 1–2", responsible: "MOA + AMOA", status: LegalActionStatus.IN_PROGRESS },
    { title: "Programme architectural préliminaire", phase: "Phase 1", deadline: "Sem. 2–3", responsible: "AMOA", status: LegalActionStatus.IN_PROGRESS },
    { title: "Rédaction et mise en forme du dossier de dépôt", phase: "Phase 1", deadline: "Sem. 3–4", responsible: "AMOA + Juriste", status: LegalActionStatus.IN_PROGRESS },
    { title: "Relecture juridique et validation Direction Générale", phase: "Phase 1", deadline: "Sem. 4", responsible: "MOA + AMOA", status: LegalActionStatus.TO_START },
    { title: "DÉPÔT OFFICIEL AUX AUTORITÉS COMPÉTENTES", phase: "Phase 1", deadline: "Avant M3", responsible: "MOA signataire", status: LegalActionStatus.LEGAL_MILESTONE_PENDING },
    { title: "Suivi instruction dossier - relances ministères", phase: "Phase 2", deadline: "M2–M3", responsible: "AMOA", status: LegalActionStatus.TO_START },
    { title: "Réception approbation + démarrage compteur 36 mois", phase: "Phase 2", deadline: "M3–M4", responsible: "AMOA", status: LegalActionStatus.TO_START },
    { title: "Obtention permis de construire", phase: "Phase 3", deadline: "M4–M6", responsible: "MOA + AMOA", status: LegalActionStatus.TO_START },
    { title: "Autorisations connexes (voirie, réseaux, sécurité incendie)", phase: "Phase 3", deadline: "M4–M6", responsible: "AMOA", status: LegalActionStatus.TO_START },
    { title: "Clauses Loi 022-2025 intégrées dans CCAP/CCTP", phase: "Phase 4", deadline: "M7", responsible: "AMOA", status: LegalActionStatus.TO_START },
    { title: "Dossiers avantages fiscaux DGI (5 catégories)", phase: "Phase 4", deadline: "M7", responsible: "AMOA + Économiste", status: LegalActionStatus.TO_START },
    { title: "Suivi mensuel délai 36 mois dans rapports EVM", phase: "Phase 5", deadline: "Mensuel", responsible: "AMOA", status: LegalActionStatus.TO_START },
    { title: "Vérification de conformité avant réception provisoire", phase: "Phase 5", deadline: "M50–M55", responsible: "AMOA + BCT + MOE", status: LegalActionStatus.TO_START },
    { title: "Certificat de conformité et récolement des travaux", phase: "Phase 6", deadline: "M55–M60", responsible: "MOA + AMOA", status: LegalActionStatus.TO_START },
    { title: "Rapport bilan fiscal Loi 022-2025 - clôture administrative", phase: "Phase 6", deadline: "M67", responsible: "AMOA", status: LegalActionStatus.TO_START },
  ];

  for (let i = 0; i < legalActions.length; i++) {
    await prisma.legalAction.create({
      data: { ...legalActions[i], projectId: project.id, position: i },
    });
  }

  console.log("Création des 7 avantages fiscaux DGI...");
  const fiscalData = [
    { category: "Ciment et liants hydrauliques", eligible: EligibilityStatus.YES, dossierStatus: "À déposer", agrementStatus: "Non démarré", estimatedSavingsXOF: BigInt(450_000_000) },
    { category: "Acier et armatures (béton armé)", eligible: EligibilityStatus.YES, dossierStatus: "À déposer", agrementStatus: "Non démarré", estimatedSavingsXOF: BigInt(380_000_000) },
    { category: "Menuiseries aluminium et vitrages", eligible: EligibilityStatus.TO_VERIFY, dossierStatus: "En cours de vérification", agrementStatus: "Avis DGI attendu", estimatedSavingsXOF: BigInt(120_000_000) },
    { category: "Équipements CVC (groupes froids, climatisation)", eligible: EligibilityStatus.TO_VERIFY, dossierStatus: "En cours de vérification", agrementStatus: "Avis DGI attendu", estimatedSavingsXOF: BigInt(95_000_000) },
    { category: "Équipements électriques (HTA/BTA)", eligible: EligibilityStatus.TO_VERIFY, dossierStatus: "En cours de vérification", agrementStatus: "Avis DGI attendu", estimatedSavingsXOF: BigInt(75_000_000) },
    { category: "Isolation thermique et acoustique", eligible: EligibilityStatus.TO_VERIFY, dossierStatus: "À analyser", agrementStatus: "Non démarré", estimatedSavingsXOF: BigInt(40_000_000) },
    { category: "Panneaux photovoltaïques (énergie verte)", eligible: EligibilityStatus.YES, dossierStatus: "À déposer", agrementStatus: "Non démarré", estimatedSavingsXOF: BigInt(85_000_000) },
  ];

  for (let i = 0; i < fiscalData.length; i++) {
    await prisma.fiscalAdvantage.create({
      data: { ...fiscalData[i], projectId: project.id, position: i },
    });
  }

  console.log("Création du registre des risques initiaux...");
  const risksData = [
    { title: "Retard de dépôt du dossier Loi 022-2025 avant le 30/06/2026", probability: 2, impact: 3, score: 6, mitigation: "Désigner un responsable unique dossier Loi 022-2025 (juriste AMOA). Réunion hebdomadaire de suivi. Alerte automatique à J-60, J-30, J-15.", status: RiskStatus.MONITORING, ownerId: juriste.id },
    { title: "Non-obtention du permis de construire dans les délais (M4–M6)", probability: 2, impact: 3, score: 6, mitigation: "Engagement précoce avec la Direction de l'Urbanisme. Dossier APS finalisé avant M4. Suivi hebdomadaire de l'instruction.", status: RiskStatus.UNDER_CONTROL, ownerId: chefProjet.id },
    { title: "Dépassement du plafond budgétaire BAC (20 Mds FCFA)", probability: 2, impact: 3, score: 6, mitigation: "Réserve de contingence de 10% intégrée au BAC. Value Engineering systématique à chaque phase. EVM mensuel avec alertes CPI.", status: RiskStatus.UNDER_CONTROL, ownerId: economiste.id },
    { title: "Retard dans les études MOE (APS/APD/PRO)", probability: 2, impact: 2, score: 4, mitigation: "Contrat MOE avec pénalités calendaires. AMOA en soutien technique. Réunions bi-hebdomadaires de suivi études.", status: RiskStatus.UNDER_CONTROL, ownerId: ingenieur.id },
    { title: "Instabilité géotechnique du site (fondations spéciales IGH)", probability: 1, impact: 3, score: 3, mitigation: "Étude géotechnique G2 PRO prescrite dès M3. Bureau de contrôle technique impliqué dès les études. Solutions de fondations spéciales budgétées.", status: RiskStatus.UNDER_CONTROL, ownerId: ingenieur.id },
    { title: "Contexte socio-politique (Burkina Faso)", probability: 2, impact: 2, score: 4, mitigation: "Plan de continuité d'activité. Clauses de force majeure dans les contrats. Monitoring sécuritaire hebdomadaire.", status: RiskStatus.MONITORING, ownerId: chefProjet.id },
    { title: "Disponibilité des matériaux de construction locaux", probability: 2, impact: 2, score: 4, mitigation: "Identification précoce des fournisseurs. Contrats d'approvisionnement cadre. Stocks tampons pour matériaux critiques.", status: RiskStatus.UNDER_CONTROL, ownerId: ingenieur.id },
    { title: "Défaillance d'un entrepreneur titulaire de marché", probability: 1, impact: 3, score: 3, mitigation: "Sélection sur critères financiers solides. Caution d'exécution de 10%. Procédures de substitution dans le CCAP.", status: RiskStatus.UNDER_CONTROL, ownerId: chefProjet.id },
  ];

  for (const risk of risksData) {
    await prisma.risk.create({
      data: { ...risk, projectId: project.id },
    });
  }

  console.log("Création des certifications RSE...");
  await Promise.all([
    prisma.certification.create({ data: {
      projectId: project.id,
      name: "HQE Bâtiment Tertiaire",
      targetLevel: "Très Bon / Exceptionnel",
      selectionPhase: "Phase 3 - M4",
      status: CertificationStatus.IN_SELECTION,
      progressPct: 20,
    }}),
    prisma.certification.create({ data: {
      projectId: project.id,
      name: "BREEAM International",
      targetLevel: "Very Good / Excellent",
      selectionPhase: "Phase 3 - M4",
      status: CertificationStatus.NOT_STARTED,
      progressPct: 0,
    }}),
    prisma.certification.create({ data: {
      projectId: project.id,
      name: "LEED v4 BD+C",
      targetLevel: "Gold / Platinum",
      selectionPhase: "Phase 3 - M4",
      status: CertificationStatus.NOT_STARTED,
      progressPct: 0,
    }}),
  ]);

  console.log("Création de la matrice RACI...");
  const raciItems = [
    { activity: "Définition du programme architectural", moa: "A", amoa: "R", moe: "C", bctEntreprises: "I" },
    { activity: "Gestion du dossier Loi 022-2025", moa: "A", amoa: "R", moe: "C", bctEntreprises: "I" },
    { activity: "Sélection et contractualisation MOE", moa: "A", amoa: "R", moe: "-", bctEntreprises: "I" },
    { activity: "Validation des études APS", moa: "A", amoa: "R", moe: "R", bctEntreprises: "C" },
    { activity: "Validation des études APD/PRO/DCE", moa: "A", amoa: "R", moe: "R", bctEntreprises: "C" },
    { activity: "Consultation entreprises (DAO travaux)", moa: "A", amoa: "R", moe: "C", bctEntreprises: "I" },
    { activity: "Attribution des marchés travaux", moa: "A", amoa: "R", moe: "C", bctEntreprises: "I" },
    { activity: "Suivi EVM mensuel", moa: "I", amoa: "R", moe: "C", bctEntreprises: "C" },
    { activity: "Réunions de chantier hebdomadaires", moa: "I", amoa: "A", moe: "R", bctEntreprises: "C" },
    { activity: "Contrôle technique (BCT)", moa: "I", amoa: "C", moe: "C", bctEntreprises: "R" },
    { activity: "Réception des ouvrages", moa: "A", amoa: "R", moe: "C", bctEntreprises: "C" },
    { activity: "Reporting RSE et CSRD", moa: "I", amoa: "R", moe: "C", bctEntreprises: "C" },
    { activity: "Gestion des avantages fiscaux DGI", moa: "A", amoa: "R", moe: "I", bctEntreprises: "I" },
    { activity: "Réception définitive + clôture GPA", moa: "A", amoa: "R", moe: "C", bctEntreprises: "C" },
  ];

  for (let i = 0; i < raciItems.length; i++) {
    await prisma.raciItem.create({
      data: { ...raciItems[i], projectId: project.id, position: i },
    });
  }

  console.log("Création de l'arborescence documentaire GED...");
  const rootFolder = await prisma.folder.create({
    data: { projectId: project.id, name: "Projet OBF Siège", parentId: null, position: 0 },
  });

  const folderStructure = [
    { name: "01 - Loi 022-2025", children: ["Dossier de dépôt", "Approbations & arrêtés", "Avantages fiscaux DGI"] },
    { name: "02 - Programmation", children: [] },
    { name: "03 - Études (APS / APD / PRO / DCE)", children: [] },
    { name: "04 - Marchés & contrats", children: [] },
    { name: "05 - Travaux", children: ["Photos chantier (par mois)", "PV de chantier", "Plans EXE"] },
    { name: "06 - Contrôle (BCT)", children: [] },
    { name: "07 - EVM & Reporting", children: [] },
    { name: "08 - RSE & CSRD", children: [] },
    { name: "09 - Réception & GPA", children: [] },
  ];

  for (let i = 0; i < folderStructure.length; i++) {
    const parentFolder = await prisma.folder.create({
      data: { projectId: project.id, name: folderStructure[i].name, parentId: rootFolder.id, position: i },
    });
    for (let j = 0; j < folderStructure[i].children.length; j++) {
      await prisma.folder.create({
        data: { projectId: project.id, name: folderStructure[i].children[j], parentId: parentFolder.id, position: j },
      });
    }
  }

  console.log("Création des canaux de messagerie...");
  const channelsData = [
    { name: "general", description: "Canal principal du projet OBF Siège - informations générales", isPrivate: false },
    { name: "technique", description: "Discussions techniques - études, travaux, BCT", isPrivate: false },
    { name: "juridique-loi-022", description: "Suivi Loi 022-2025 - conformité réglementaire", isPrivate: false },
    { name: "rse-csrd", description: "RSE, empreinte carbone, certifications, CSRD", isPrivate: false },
    { name: "direction-copil", description: "Canal réservé Direction Générale et CoPil", isPrivate: true, allowedRoles: ["SUPER_ADMIN", "MOA_DG", "MOA_COPIL", "AMOA_CHEF"] },
  ];

  for (const ch of channelsData) {
    const channel = await prisma.channel.create({
      data: {
        projectId: project.id,
        name: ch.name,
        description: ch.description,
        isPrivate: ch.isPrivate ?? false,
      },
    });

    // Ajouter tous les utilisateurs actifs comme membres
    for (const user of users) {
      if (!ch.isPrivate || (ch as { allowedRoles?: string[] }).allowedRoles?.includes(user.role)) {
        await prisma.channelMember.create({
          data: { channelId: channel.id, userId: user.id },
        });
      }
    }
  }

  console.log("Création du board Kanban Phase 1...");
  const board = await prisma.board.create({
    data: {
      projectId: project.id,
      name: "Phase 1 - Programmation & Dossier Loi 022-2025",
      description: "Tâches de la phase 1 : programme architectural et constitution du dossier légal",
    },
  });

  const [colTodo, colDoing, colReview, colBlocked, colDone] = await Promise.all([
    prisma.column.create({ data: { boardId: board.id, name: "À faire", position: 0, color: "#6B7280" } }),
    prisma.column.create({ data: { boardId: board.id, name: "En cours", position: 1, color: "#3B82F6" } }),
    prisma.column.create({ data: { boardId: board.id, name: "En revue", position: 2, color: "#F59E0B" } }),
    prisma.column.create({ data: { boardId: board.id, name: "Bloqué", position: 3, color: "#EF4444" } }),
    prisma.column.create({ data: { boardId: board.id, name: "Terminé", position: 4, color: "#10B981" } }),
  ]);

  const tasksDemoData = [
    {
      columnId: colDone.id,
      title: "Audit réglementaire initial - Loi 022-2025",
      description: "Identifier toutes les pièces requises pour le dossier de dépôt selon la Loi N° 022-2025/ALT.",
      priority: TaskPriority.URGENT,
      assigneeId: juriste.id,
      dueDate: new Date("2026-04-15"),
      labels: ["Loi 022-2025", "Juridique"],
      progressPct: 100,
    },
    {
      columnId: colDoing.id,
      title: "Collecte des documents OBF (titre foncier, plan cadastral, K-BIS, CA)",
      description: "Obtenir auprès de Orange BF et Orange Money BF tous les documents institutionnels nécessaires.",
      priority: TaskPriority.URGENT,
      assigneeId: chefProjet.id,
      dueDate: new Date("2026-05-20"),
      labels: ["Loi 022-2025", "MOA"],
      progressPct: 60,
    },
    {
      columnId: colDoing.id,
      title: "Rédaction du programme architectural préliminaire",
      description: "Programme détaillé : IGH minimum R+7 + sous-sol + RDC + VRD + parkings + espaces paysagers + postes techniques.",
      priority: TaskPriority.HIGH,
      assigneeId: ingenieur.id,
      dueDate: new Date("2026-05-30"),
      labels: ["Architecture", "Programme"],
      progressPct: 40,
    },
    {
      columnId: colTodo.id,
      title: "Finalisation et mise en forme du dossier de dépôt",
      description: "Assemblage de l'intégralité des pièces, vérification de la conformité, préparation pour signature DG Orange BF.",
      priority: TaskPriority.URGENT,
      assigneeId: juriste.id,
      dueDate: new Date("2026-06-10"),
      labels: ["Loi 022-2025", "Juridique"],
      progressPct: 0,
    },
    {
      columnId: colTodo.id,
      title: "Dépôt officiel dossier Loi 022-2025 - AVANT le 30/06/2026",
      description: "JALON LÉGAL ABSOLU - Dépôt physique aux autorités compétentes + obtention accusé de réception officiel.",
      priority: TaskPriority.URGENT,
      assigneeId: chefProjet.id,
      dueDate: new Date("2026-06-25"),
      labels: ["Loi 022-2025", "JALON LÉGAL", "ABSOLU"],
      progressPct: 0,
    },
  ];

  for (let i = 0; i < tasksDemoData.length; i++) {
    await prisma.task.create({
      data: {
        ...tasksDemoData[i],
        position: i,
        createdById: chefProjet.id,
      },
    });
  }

  console.log("Création de quelques données EVM de démo (M1 actuel)...");
  await prisma.evmMonthlyEntry.create({
    data: {
      projectId: project.id,
      monthNumber: 1,
      monthDate: new Date("2026-03-23"),
      pvCumulXOF: BigInt(298_507_462),   // BAC / 67 mois × 1
      evCumulXOF: BigInt(180_000_000),    // 60% du PV
      acCumulXOF: BigInt(195_000_000),    // légèrement au-dessus de l'EV
      physicalProgress: 5.2,
      bacXOF: BigInt(20_000_000_000),
      notes: "Données M1 provisoires - phase de démarrage : constitution équipe AMOA, audit réglementaire, lancement collecte documents",
      enteredById: economiste.id,
    },
  });

  console.log("Création des notifications de démonstration...");
  await Promise.all([
    prisma.notification.create({ data: {
      userId: chefProjet.id,
      type: NotificationType.LEGAL_DEADLINE_ALERT,
      title: "Alerte Loi 022-2025 - Délai de dépôt",
      body: "Il reste 55 jours avant la date limite de dépôt du 30/06/2026. Assurez-vous que toutes les pièces sont collectées.",
      link: "/legal",
      isRead: false,
    }}),
    prisma.notification.create({ data: {
      userId: economiste.id,
      type: NotificationType.EVM_ALERT,
      title: "Saisie EVM - Mois M1 en attente de validation",
      body: "Les données EVM du mois M1 ont été saisies et attendent votre validation.",
      link: "/evm",
      isRead: false,
    }}),
    prisma.notification.create({ data: {
      userId: juriste.id,
      type: NotificationType.TASK_ASSIGNED,
      title: "Tâche assignée : Finalisation dossier Loi 022-2025",
      body: "Vous avez été assigné à la tâche critique de finalisation du dossier de dépôt Loi 022-2025.",
      link: "/tasks",
      isRead: false,
    }}),
    prisma.notification.create({ data: {
      userId: chefProjet.id,
      type: NotificationType.MILESTONE_DUE,
      title: "Jalon imminent - Validation CoPil Programme",
      body: "Le jalon M1 'Validation CoPil : Programme + Budget' est en cours. Préparez la présentation CoPil.",
      link: "/planning",
      isRead: true,
    }}),
  ]);

  console.log("Création des données du Dashboard Client (Vague 1)...");
  await prisma.projectHealthScore.create({
    data: {
      projectId: project.id,
      date: new Date(),
      overallScore: 85,
      scheduleScore: 90,
      budgetScore: 95,
      qualityScore: 80,
      safetyScore: 100,
      weatherEmoji: "☀️",
      commentary: "Le projet démarre dans d'excellentes conditions. Le budget est maîtrisé et l'équipe est mobilisée.",
    }
  });

  console.log("Création des photos de chantier de démonstration...");
  const photo1 = await prisma.sitePhoto.create({
    data: {
      projectId: project.id,
      zone: "Terrain Actuel",
      caption: "Vue initiale du terrain avant démarrage des travaux",
      fileUrl: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200",
      thumbnailUrl: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&q=80&w=400",
      takenAt: new Date("2026-03-20"),
      takenById: chefProjet.id,
      tags: ["Avant Travaux", "Terrain"],
    }
  });

  const photo2 = await prisma.sitePhoto.create({
    data: {
      projectId: project.id,
      zone: "Installation Chantier",
      caption: "Mise en place de la base de vie",
      fileUrl: "https://images.unsplash.com/photo-1504307651254-35680f356f27?auto=format&fit=crop&q=80&w=1200",
      thumbnailUrl: "https://images.unsplash.com/photo-1504307651254-35680f356f27?auto=format&fit=crop&q=80&w=400",
      takenAt: new Date("2026-03-25"),
      takenById: ingenieur.id,
      tags: ["Base de vie", "Installation"],
    }
  });

  await prisma.photoAnnotation.create({
    data: {
      photoId: photo2.id,
      authorId: dgOrange.id,
      content: "La base de vie semble bien organisée. Pensez à l'accès sécurisé.",
      posX: 45.5,
      posY: 60.2,
    }
  });

  console.log("Création des données de Validation Client (Vague 2)...");
  const validation1 = await prisma.clientValidation.create({
    data: {
      projectId: project.id,
      title: "Validation Programme Architectural",
      description: "Validation du programme détaillé pour le siège OBF incluant les surfaces, l'organigramme fonctionnel et le budget prévisionnel.",
      status: "PENDING",
      submittedById: chefProjet.id,
    }
  });

  const validation2 = await prisma.clientValidation.create({
    data: {
      projectId: project.id,
      title: "Approbation Dossier Loi 022-2025",
      description: "Validation finale du dossier complet de demande d'agrément Loi 022-2025 avant dépôt aux autorités.",
      status: "APPROVED_WITH_RESERVES",
      submittedById: juriste.id,
      reviewedAt: new Date(),
      reviewedById: dgOrange.id,
    }
  });

  await prisma.clientReserve.create({
    data: {
      validationId: validation2.id,
      category: "Conformité",
      description: "Mettre à jour la pièce n°4 (K-Bis) avec la dernière version datant de moins de 3 mois.",
      priority: "URGENT",
    }
  });

  console.log("Création des rapports automatisés (Vague 2)...");
  await prisma.report.create({
    data: {
      projectId: project.id,
      type: "WEEKLY_FLASH",
      title: "Rapport Flash Semaine 12/2026",
      period: "Semaine 12",
      status: "GENERATED",
      createdById: chefProjet.id,
      fileUrl: "/reports/flash-s12.pdf",
    }
  });

  console.log("Création des paramètres de l'application...");
  await prisma.appSetting.createMany({
    data: [
      { key: "project.startDate", value: "2026-03-23" },
      { key: "project.bac", value: "20000000000" },
      { key: "project.durationMonths", value: "67" },
      { key: "legal.filingDeadline", value: "2026-06-30" },
      { key: "app.version", value: "1.0.0" },
    ],
  });

  console.log("\n==============================================");
  console.log("SEED TERMINÉ - AGEM TrackPro");
  console.log("==============================================");
  console.log(`Projet : ${project.name}`);
  console.log(`Code : ${project.code}`);
  console.log(`Budget : 20 000 000 000 FCFA`);
  console.log(`Utilisateurs créés : ${users.length}`);
  console.log("\nComptes de démonstration (mot de passe : Demo2026!):");
  for (const u of users) {
    console.log(`  ${u.email} (${u.role})`);
  }
  console.log("==============================================\n");
}

main()
  .catch((e) => {
    console.error("Erreur seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
