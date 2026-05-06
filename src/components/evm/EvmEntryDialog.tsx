"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Calculator } from "lucide-react";
import { computeEvm } from "@/lib/evm";
import { formatXOF, formatPct } from "@/lib/format";
import { getCpiZoneColor, getCpiZoneLabel } from "@/lib/evm";
import { toast } from "sonner";

const evmSchema = z.object({
  monthNumber: z.number().min(1).max(67),
  pvCumulMillions: z.number().min(0),
  evCumulMillions: z.number().min(0),
  acCumulMillions: z.number().min(0),
  physicalProgress: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type EvmForm = z.infer<typeof evmSchema>;

interface EvmEntryDialogProps {
  projectId: string;
  bacXOF: string;
  userId: string;
  durationMonths: number;
  nextMonthNumber: number;
  onClose: () => void;
}

export function EvmEntryDialog({
  projectId,
  bacXOF,
  userId,
  durationMonths,
  nextMonthNumber,
  onClose,
}: EvmEntryDialogProps) {
  const [preview, setPreview] = useState<ReturnType<typeof computeEvm> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<EvmForm>({
    resolver: zodResolver(evmSchema),
    defaultValues: { monthNumber: nextMonthNumber, physicalProgress: 0 },
  });

  const formValues = watch();

  const handlePreview = () => {
    const pv = BigInt(Math.round((formValues.pvCumulMillions ?? 0) * 1_000_000));
    const ev = BigInt(Math.round((formValues.evCumulMillions ?? 0) * 1_000_000));
    const ac = BigInt(Math.round((formValues.acCumulMillions ?? 0) * 1_000_000));
    const bac = BigInt(bacXOF);
    setPreview(computeEvm({ pv, ev, ac, bac, physicalProgress: formValues.physicalProgress ?? 0 }));
  };

  const onSubmit = async (data: EvmForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          monthNumber: data.monthNumber,
          pvCumulXOF: Math.round(data.pvCumulMillions * 1_000_000),
          evCumulXOF: Math.round(data.evCumulMillions * 1_000_000),
          acCumulXOF: Math.round(data.acCumulMillions * 1_000_000),
          physicalProgress: data.physicalProgress,
          bacXOF,
          notes: data.notes,
          enteredById: userId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Données EVM enregistrées avec succès");
      onClose();
      window.location.reload();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div
        className="w-full max-w-lg rounded-2xl shadow-xl"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Saisie EVM - Mois {nextMonthNumber}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "PV Cumulé (M FCFA)", field: "pvCumulMillions" as const },
              { label: "EV Cumulé (M FCFA)", field: "evCumulMillions" as const },
              { label: "AC Cumulé (M FCFA)", field: "acCumulMillions" as const },
              { label: "Avancement physique (%)", field: "physicalProgress" as const },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  {label}
                </label>
                <input
                  {...register(field, { valueAsNumber: true })}
                  type="number"
                  step="0.001"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Notes (optionnel)
            </label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Preview EVM */}
          {preview && (
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Indicateurs calculés
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <span style={{ color: "var(--text-muted)" }}>CPI</span>
                <span className="font-semibold" style={{ color: preview.cpi !== null ? getCpiZoneColor(preview.cpiZone) : "var(--text-muted)" }}>
                  {preview.cpi?.toFixed(3) ?? "-"} ({getCpiZoneLabel(preview.cpiZone)})
                </span>
                <span style={{ color: "var(--text-muted)" }}>SPI</span>
                <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {preview.spi?.toFixed(3) ?? "-"}
                </span>
                <span style={{ color: "var(--text-muted)" }}>EAC</span>
                <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {preview.eac !== null ? formatXOF(preview.eac, "compact") : "-"}
                </span>
                {preview.penaltyPct > 0 && (
                  <>
                    <span style={{ color: "var(--status-danger)" }}>Pénalité</span>
                    <span className="font-semibold" style={{ color: "var(--status-danger)" }}>
                      {preview.penaltyPct}% - {formatXOF(preview.penaltyAmountXOF, "compact")}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: "var(--agem-gold)", color: "var(--agem-gold)" }}
            >
              <Calculator className="w-3.5 h-3.5" />
              Calculer
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
              style={{ backgroundColor: "var(--agem-gold)", color: "var(--agem-black)" }}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
