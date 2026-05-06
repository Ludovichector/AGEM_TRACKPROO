"use client";

import { useState } from "react";
import { 
  TrendingUp, TrendingDown, Wallet, Clock, 
  Plus, Filter, Search, CheckCircle2, XCircle, 
  MoreHorizontal, Trash2, FileText, PieChart,
  ArrowUpRight, ArrowDownRight, History, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { recordTransaction, approveTransaction, deleteTransaction } from "@/app/(dashboard)/accounting/actions";

interface Transaction {
  id: string;
  transactionType: "DEPENSE" | "RECETTE";
  title: string;
  description: string | null;
  amountXOF: string;
  date: string;
  category: string;
  status: string;
  invoiceRef: string | null;
  rejectionReason: string | null;
  createdAt: string;
  recordedBy: { fullName: string; role: string };
  approvedBy?: { fullName: string } | null;
}

interface Stats {
  totalRecettesXOF: string;
  totalDepensesXOF: string;
  soldeXOF: string;
  pendingCount: number;
  totalCount: number;
  byCategoryDepense: Record<string, string>;
  byCategoryRecette: Record<string, string>;
}

interface Props {
  projectId: string;
  projectName: string;
  transactions: Transaction[];
  stats: Stats;
  canCreate: boolean;
  canApprove: boolean;
  canDelete: boolean;
}

type Tab = "journal" | "recettes" | "depenses" | "rapports";

export function AccountingPageClient({ 
  projectId, 
  projectName, 
  transactions, 
  stats,
  canCreate,
  canApprove,
  canDelete
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("journal");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("toutes");
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formType, setFormType] = useState<"DEPENSE" | "RECETTE">("DEPENSE");
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "AUTRE",
    date: new Date().toISOString().split('T')[0],
    description: "",
    invoiceRef: ""
  });

  const categories = formType === "DEPENSE" 
    ? ["MATERIEL", "SERVICES", "MAIN_D_OEUVRE", "FRAIS_GENERAUX", "AUTRE_DEPENSE", "AUTRE"]
    : ["AVANCE_MARCHE", "ACOMPTE_CLIENT", "SUBVENTION", "VIREMENT_FINANCEMENT", "AUTRE_RECETTE"];

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                         t.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filter === "toutes" || t.status.toLowerCase() === filter.toLowerCase();
    const matchesTab = activeTab === "journal" || 
                      (activeTab === "recettes" && t.transactionType === "RECETTE") ||
                      (activeTab === "depenses" && t.transactionType === "DEPENSE");
    return matchesSearch && matchesStatus && matchesTab;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setIsSubmitting(true);
    try {
      const res = await recordTransaction({
        projectId,
        transactionType: formType,
        title: formData.title,
        amountXOF: parseFloat(formData.amount),
        category: formData.category as any,
        date: formData.date,
        description: formData.description,
        invoiceRef: formData.invoiceRef
      });
      if (res.success) {
        toast.success("Transaction enregistrée");
        setIsModalOpen(false);
        setFormData({ title: "", amount: "", category: "AUTRE", date: new Date().toISOString().split('T')[0], description: "", invoiceRef: "" });
      } else {
        toast.error(res.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      toast.error("Erreur serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string, action: "APPROUVE" | "REJETE") => {
    if (!canApprove) return;
    const reason = action === "REJETE" ? prompt("Motif du rejet ?") : undefined;
    if (action === "REJETE" && reason === null) return;

    try {
      const res = await approveTransaction({ id, action, rejectionReason: reason || undefined });
      if (res.success) toast.success(action === "APPROUVE" ? "Validé" : "Rejeté");
      else toast.error(res.error);
    } catch (err) {
      toast.error("Erreur serveur");
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete || !confirm("Supprimer cette transaction ?")) return;
    try {
      const res = await deleteTransaction(id);
      if (res.success) toast.success("Supprimé");
      else toast.error(res.error);
    } catch (err) {
      toast.error("Erreur serveur");
    }
  };

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('fr-FR').format(parseInt(val)) + " FCFA";
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--agem-gold)] mb-1">Comptabilité Générale</p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Gestion des Flux Financiers
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{projectName}</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--agem-gold)]/20"
            style={{ background: "var(--agem-gold)", color: "#0D0D0D" }}
          >
            <Plus className="w-5 h-5" />
            Nouvelle Transaction
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Solde Disponible" 
          value={formatCurrency(stats.soldeXOF)} 
          icon={<Wallet className="w-6 h-6" />}
          color="var(--agem-gold)"
          trend={parseInt(stats.soldeXOF) >= 0 ? "positive" : "negative"}
        />
        <StatCard 
          title="Total Recettes" 
          value={formatCurrency(stats.totalRecettesXOF)} 
          icon={<ArrowUpRight className="w-6 h-6" />}
          color="#10B981"
        />
        <StatCard 
          title="Total Dépenses" 
          value={formatCurrency(stats.totalDepensesXOF)} 
          icon={<ArrowDownRight className="w-6 h-6" />}
          color="#EF4444"
        />
        <StatCard 
          title="En attente" 
          value={`${stats.pendingCount} transactions`} 
          icon={<Clock className="w-6 h-6" />}
          color="var(--text-muted)"
        />
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-1">
        <div className="flex gap-1">
          <TabButton active={activeTab === "journal"} onClick={() => setActiveTab("journal")} icon={<History className="w-4 h-4"/>} label="Journal" />
          <TabButton active={activeTab === "recettes"} onClick={() => setActiveTab("recettes")} icon={<TrendingUp className="w-4 h-4"/>} label="Recettes" />
          <TabButton active={activeTab === "depenses"} onClick={() => setActiveTab("depenses")} icon={<TrendingDown className="w-4 h-4"/>} label="Dépenses" />
          <TabButton active={activeTab === "rapports"} onClick={() => setActiveTab("rapports")} icon={<PieChart className="w-4 h-4"/>} label="Analyses" />
        </div>

        {activeTab !== "rapports" && (
          <div className="flex items-center gap-3 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-subtle)] mb-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-transparent text-sm focus:outline-none w-48"
              />
            </div>
            <div className="w-px h-6 bg-[var(--border-subtle)]" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-sm pr-8 pl-2 py-2 focus:outline-none appearance-none cursor-pointer font-medium"
            >
              <option value="toutes">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Validés</option>
              <option value="rejete">Rejetés</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="min-h-[400px]">
        {activeTab === "rapports" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8">
            <ReportSection title="Répartition des Recettes" data={stats.byCategoryRecette} formatCurrency={formatCurrency} />
            <ReportSection title="Répartition des Dépenses" data={stats.byCategoryDepense} formatCurrency={formatCurrency} />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>Aucune transaction trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] px-4">
                      <th className="pb-2 pl-4">Date</th>
                      <th className="pb-2">Désignation</th>
                      <th className="pb-2">Catégorie</th>
                      <th className="pb-2">Montant</th>
                      <th className="pb-2">Statut</th>
                      <th className="pb-2 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <TransactionRow 
                        key={t.id} 
                        t={t} 
                        onApprove={handleApprove}
                        onDelete={handleDelete}
                        canApprove={canApprove}
                        canDelete={canDelete}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-[var(--bg-card)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-subtle)]"
            >
              <div className="p-8">
                <h2 className="text-2xl font-black mb-6">Nouvel Enregistrement</h2>
                
                {/* Type Toggle */}
                <div className="flex p-1 bg-[var(--bg-elevated)] rounded-2xl mb-8 border border-[var(--border-subtle)]">
                  <button 
                    onClick={() => {setFormType("DEPENSE"); setFormData(p => ({...p, category: "AUTRE"}));}}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formType === "DEPENSE" ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-[var(--text-muted)]'}`}
                  >
                    Dépense (Sortie)
                  </button>
                  <button 
                    onClick={() => {setFormType("RECETTE"); setFormData(p => ({...p, category: "AUTRE_RECETTE"}));}}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formType === "RECETTE" ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--text-muted)]'}`}
                  >
                    Recette (Entrée)
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold uppercase mb-2 block text-[var(--text-muted)]">Libellé</label>
                      <input 
                        required
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:border-[var(--agem-gold)] outline-none"
                        value={formData.title}
                        onChange={e => setFormData(p => ({...p, title: e.target.value}))}
                        placeholder="Ex: Achat ciment, Avance client..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase mb-2 block text-[var(--text-muted)]">Montant (FCFA)</label>
                      <input 
                        required type="number"
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:border-[var(--agem-gold)] outline-none"
                        value={formData.amount}
                        onChange={e => setFormData(p => ({...p, amount: e.target.value}))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase mb-2 block text-[var(--text-muted)]">Date</label>
                      <input 
                        required type="date"
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:border-[var(--agem-gold)] outline-none"
                        value={formData.date}
                        onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold uppercase mb-2 block text-[var(--text-muted)]">Catégorie</label>
                      <select 
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:border-[var(--agem-gold)] outline-none appearance-none"
                        value={formData.category}
                        onChange={e => setFormData(p => ({...p, category: e.target.value}))}
                      >
                        {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 rounded-xl font-bold bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
                    >
                      Annuler
                    </button>
                    <button 
                      disabled={isSubmitting}
                      className="flex-1 py-4 rounded-xl font-bold transition-all disabled:opacity-50"
                      style={{ background: "var(--agem-gold)", color: "#0D0D0D" }}
                    >
                      {isSubmitting ? "Enregistrement..." : "Confirmer"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }: { title: string, value: string, icon: any, color: string, trend?: "positive" | "negative" }) {
  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${color}15`, color: color }}>
          {icon}
        </div>
        {trend && (
          <div className={`text-xs font-bold px-2 py-1 rounded-full ${trend === "positive" ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend === "positive" ? "+ 12%" : "- 5%"}
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black mt-1 tracking-tight">{value}</h3>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-[var(--bg-card)] text-[var(--agem-gold)] shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function TransactionRow({ t, onApprove, onDelete, canApprove, canDelete, formatCurrency }: { t: Transaction, onApprove: any, onDelete: any, canApprove: boolean, canDelete: boolean, formatCurrency: any }) {
  const isRecette = t.transactionType === "RECETTE";
  
  return (
    <tr className="group bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] transition-colors rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <td className="py-4 pl-4 rounded-l-2xl">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isRecette ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {isRecette ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
          </div>
          <div>
            <p className="text-sm font-bold">{format(new Date(t.date), 'dd MMM yyyy', { locale: fr })}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{format(new Date(t.createdAt), 'HH:mm')}</p>
          </div>
        </div>
      </td>
      <td className="py-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">{t.title}</p>
        <p className="text-xs text-[var(--text-muted)] line-clamp-1">{t.recordedBy.fullName} • {t.recordedBy.role}</p>
      </td>
      <td className="py-4">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-elevated)] px-2 py-1 rounded-md border border-[var(--border-subtle)]">
          {t.category.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="py-4">
        <p className={`text-sm font-black ${isRecette ? 'text-emerald-500' : 'text-[var(--text-primary)]'}`}>
          {isRecette ? '+' : '-'} {formatCurrency(t.amountXOF)}
        </p>
      </td>
      <td className="py-4">
        <StatusBadge status={t.status} />
      </td>
      <td className="py-4 pr-4 text-right rounded-r-2xl">
        <div className="flex items-center justify-end gap-2">
          {t.status === "EN_ATTENTE" && canApprove && (
            <>
              <button onClick={() => onApprove(t.id, "APPROUVE")} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Approuver">
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button onClick={() => onApprove(t.id, "REJETE")} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Rejeter">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {canDelete && (
            <button onClick={() => onDelete(t.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all text-[var(--text-muted)]" title="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    EN_ATTENTE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    APPROUVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    REJETE: "bg-red-500/10 text-red-500 border-red-500/20"
  }[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";

  const labels = {
    EN_ATTENTE: "En attente",
    APPROUVE: "Validé",
    REJETE: "Rejeté"
  }[status] || status;

  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${styles}`}>
      {labels}
    </span>
  );
}

function ReportSection({ title, data, formatCurrency }: { title: string, data: Record<string, string>, formatCurrency: any }) {
  const entries = Object.entries(data);
  const total = entries.reduce((acc, [_, v]) => acc + BigInt(v), BigInt(0));

  return (
    <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm">
      <h3 className="text-xl font-black mb-6 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-[var(--agem-gold)]" />
        {title}
      </h3>
      <div className="space-y-6">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-10">Aucune donnée à afficher</p>
        ) : (
          entries.map(([cat, val]) => {
            const percentage = total > BigInt(0) ? Number((BigInt(val) * BigInt(100)) / total) : 0;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-[var(--text-secondary)]">{cat.replace(/_/g, ' ')}</span>
                  <span>{formatCurrency(val)}</span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full bg-[var(--agem-gold)] rounded-full"
                  />
                </div>
                <p className="text-[10px] text-right text-[var(--text-muted)] font-bold">{percentage}% du total</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
