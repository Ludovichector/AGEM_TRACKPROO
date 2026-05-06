"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
});
type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    if (result?.error) { setError("Email ou mot de passe incorrect."); return; }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Titre */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
          Bienvenue
        </h1>
        <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>
          Chantier du Siège Social
        </p>
        <p className="text-base" style={{ color: "var(--agem-gold)" }}>
          Orange Burkina Faso
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Email */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="w-4 h-4 transition-colors" style={{ color: "var(--text-muted)" }} />
          </div>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="Adresse e-mail"
            className="w-full pl-11 pr-4 py-4 rounded-2xl text-base transition-all outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: `1.5px solid ${errors.email ? "var(--status-danger)" : "var(--border-subtle)"}`,
              color: "var(--text-primary)",
            }}
            onFocus={e => { e.currentTarget.style.border = "1.5px solid var(--agem-gold)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,169,97,0.12)"; }}
            onBlur={e => { e.currentTarget.style.border = `1.5px solid ${errors.email ? "var(--status-danger)" : "var(--border-subtle)"}`; e.currentTarget.style.boxShadow = "none"; }}
          />
          {errors.email && <p className="text-xs mt-1.5 pl-1" style={{ color: "var(--status-danger)" }}>{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <input
            {...register("password")}
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Mot de passe"
            className="w-full pl-11 pr-12 py-4 rounded-2xl text-base transition-all outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: `1.5px solid ${errors.password ? "var(--status-danger)" : "var(--border-subtle)"}`,
              color: "var(--text-primary)",
            }}
            onFocus={e => { e.currentTarget.style.border = "1.5px solid var(--agem-gold)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,169,97,0.12)"; }}
            onBlur={e => { e.currentTarget.style.border = `1.5px solid ${errors.password ? "var(--status-danger)" : "var(--border-subtle)"}`; e.currentTarget.style.boxShadow = "none"; }}
          />
          <button type="button" onClick={() => setShowPwd(!showPwd)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}>
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {errors.password && <p className="text-xs mt-1.5 pl-1" style={{ color: "var(--status-danger)" }}>{errors.password.message}</p>}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--status-danger)" }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.01, boxShadow: "0 8px 30px rgba(201,169,97,0.35)" }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-60 mt-2"
          style={{ background: "var(--agem-gold)", color: "#0D0D0D" }}
        >
          {isSubmitting
            ? <div className="w-5 h-5 border-2 border-black/20 border-t-black/80 rounded-full animate-spin" />
            : <><span>Se connecter</span><ArrowRight className="w-5 h-5" /></>
          }
        </motion.button>
      </form>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── Gauche : branding AGEM ── */}
      <div className="hidden lg:flex relative w-[44%] overflow-hidden flex-col items-center justify-center" style={{ background: "#0C0C0C" }}>

        {/* Effets de fond */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(201,169,97,0.1) 0%, transparent 65%)" }} />
          {/* Lignes décoratives */}
          <div className="absolute bottom-0 left-0 w-full h-px opacity-10" style={{ background: "linear-gradient(90deg, transparent, var(--agem-gold), transparent)" }} />
          <div className="absolute top-0 right-0 w-px h-full opacity-10" style={{ background: "linear-gradient(180deg, transparent, var(--agem-gold), transparent)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center text-center px-12"
        >
          {/* Logo dans un cadre propre */}
          <div className="mb-12 p-6 rounded-3xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 0 60px rgba(201,169,97,0.06)" }}>
            <Image src="/agem-logo.png" alt="AGEM" width={150} height={64} className="object-contain" />
          </div>

          {/* Séparateur doré */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-px" style={{ background: "rgba(201,169,97,0.3)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--agem-gold)" }} />
            <div className="w-8 h-px" style={{ background: "rgba(201,169,97,0.3)" }} />
          </div>

          {/* Titre */}
          <h2 className="text-[2rem] font-extrabold leading-tight tracking-tight mb-4" style={{ color: "white" }}>
            Plateforme de suivi<br />de chantier
          </h2>

          <p className="text-lg font-semibold mt-3" style={{ color: "var(--agem-gold)" }}>
            Orange Burkina Faso
          </p>
        </motion.div>

        {/* Footer */}
        <p className="absolute bottom-6 text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
          © {new Date().getFullYear()} AGEM-Développement
        </p>
      </div>

      {/* ── Droite : formulaire ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative" style={{ background: "var(--bg-canvas)" }}>

        {/* Trait doré haut */}
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: "linear-gradient(90deg, var(--agem-gold), rgba(201,169,97,0.2))" }} />

        {/* Mobile logo */}
        <div className="absolute top-7 left-7 lg:hidden">
          <Image src="/agem-logo.png" alt="AGEM" width={80} height={34} className="object-contain" />
        </div>

        {/* Carte formulaire */}
        <div className="w-full max-w-sm px-6">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl" style={{ background: "var(--bg-card)" }} />}>
            <LoginFormContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
