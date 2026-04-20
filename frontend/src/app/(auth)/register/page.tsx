"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { AtSign, Lock, User, Github, Chrome, Eye, EyeOff, Zap, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/src/services/auth.service";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const makeFadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: EASE },
  },
});

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const perks = [
  "AI-suggested API & DB schemas",
  "ML-powered risk prediction",
  "Shared project room controls",
  "Folder scaffolding engine",
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const passwordMatch = form.password && form.confirm && form.password === form.confirm;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!passwordMatch) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      router.push("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11151f] flex items-center justify-center px-4 py-12 relative overflow-hidden text-white">
      <div className="absolute top-[-15%] right-[-5%] w-125 h-125 rounded-full bg-[#f97316]/6 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-100 h-100 rounded-full bg-[#f97316]/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* ── LEFT —  */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="hidden lg:flex flex-col gap-10"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center shadow-lg shadow-[#f97316]/30">
              <Zap size={18} className="text-black fill-black" />
            </div>
            <span className="font-black text-white text-base tracking-tight font-mono uppercase">
              Planex <span className="text-[#f97316]">AI</span>
            </span>
          </Link>

          {/* Headline */}
          <div>
            <p className="text-[#f97316] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
              New Identity Protocol
            </p>
            <h1 className="text-[60px] font-black leading-[0.92] tracking-tighter uppercase">
              <span className="text-white">FORGE</span>
              <br />
              <span className="text-[#f97316]">YOUR</span>
              <br />
              <span className="text-white">FUTURE.</span>
            </h1>
            <p className="text-[#aab1bf] text-sm leading-relaxed mt-6 max-w-xs">
              Join thousands of architects building the next generation of systems. Your workspace awaits.
            </p>
          </div>

          {/* Perks */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {perks.map((perk, i) => (
              <motion.div
                key={perk}
                variants={makeFadeUp(i)}
                className="flex items-center gap-3"
              >
                <CheckCircle2 size={15} className="text-[#f97316] shrink-0" />
                <span className="text-[#a89880] text-sm">{perk}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Status */}
          <div className="border-t border-white/5 pt-6 flex items-center gap-2">
            <Shield size={12} className="text-[#4ade80]" />
            <span className="text-[#4ade80] text-[10px] font-bold uppercase tracking-widest">
              End-to-end encrypted
            </span>
          </div>
        </motion.div>

        {/* ── RIGHT — Register Card*/}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="w-full max-w-md mx-auto"
        >
          <div className="relative rounded-3xl border border-white/10 bg-[#10141d]/90 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-sm">

            {/* Grid icon */}
            <div className="absolute top-5 right-5 grid grid-cols-2 gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-sm bg-[#f97316]/40" />
              ))}
            </div>

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-white text-xl font-bold tracking-tight">Register Identity</h2>
              <p className="text-[#aab1bf] text-sm mt-1">Create your architect profile.</p>
            </div>

            {/* OAuth */}
            <div className="flex flex-col gap-3 mb-6">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer w-full flex items-center justify-center gap-3 bg-[#141a25] hover:bg-[#1a2231] border border-white/10 text-white font-semibold text-sm py-3 rounded-xl transition-all"
              >
                <Github size={17} />
                Continue with GitHub
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/8 border border-white/10 text-white font-semibold text-sm py-3 rounded-xl transition-all"
              >
                <Chrome size={17} className="text-[#f97316]" />
                Continue with Google
              </motion.button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[#8b93a6] text-[10px] font-bold uppercase tracking-widest">Or register manually</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Fields */}
            <form onSubmit={handleRegister} className="flex flex-col gap-4 mb-5">

              {/* Name */}
              <div>
                <label className="text-[#f97316] text-[10px] font-bold uppercase tracking-widest block mb-2">
                  Display Name
                </label>
                <div className="flex items-center gap-3 bg-[#0b0f16] border border-white/8 focus-within:border-[#f97316]/50 rounded-xl px-4 py-3 transition-colors">
                  <User size={14} className="text-[#8b93a6] shrink-0" />
                  <input
                    type="text"
                    placeholder="Your architect name"
                    value={form.name}
                    onChange={handleChange("name")}
                    className="auth-input bg-transparent text-white text-sm placeholder-[#647086] outline-none w-full"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[#f97316] text-[10px] font-bold uppercase tracking-widest block mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3 bg-[#0b0f16] border border-white/8 focus-within:border-[#f97316]/50 rounded-xl px-4 py-3 transition-colors">
                  <AtSign size={14} className="text-[#8b93a6] shrink-0" />
                  <input
                    type="email"
                    placeholder="architect@planex.ai"
                    value={form.email}
                    onChange={handleChange("email")}
                    className="auth-input bg-transparent text-white text-sm placeholder-[#647086] outline-none w-full"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[#f97316] text-[10px] font-bold uppercase tracking-widest block mb-2">
                  Password
                </label>
                <div className="flex items-center gap-3 bg-[#0b0f16] border border-white/8 focus-within:border-[#f97316]/50 rounded-xl px-4 py-3 transition-colors">
                  <Lock size={14} className="text-[#8b93a6] shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange("password")}
                    className="auth-input bg-transparent text-white text-sm placeholder-[#647086] outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#8b93a6] hover:text-[#f97316] transition-colors shrink-0"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-[#f97316] text-[10px] font-bold uppercase tracking-widest block mb-2">
                  Confirm Password
                </label>
                <div className={`flex items-center gap-3 bg-[#0b0f16] border rounded-xl px-4 py-3 transition-colors focus-within:border-[#f97316]/50 ${
                  form.confirm && !passwordMatch ? "border-red-500/40" : "border-white/8"
                }`}>
                  <Lock size={14} className="text-[#8b93a6] shrink-0" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={handleChange("confirm")}
                    className="auth-input bg-transparent text-white text-sm placeholder-[#647086] outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-[#8b93a6] hover:text-[#f97316] transition-colors shrink-0"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {passwordMatch && (
                    <CheckCircle2 size={14} className="text-[#4ade80] shrink-0" />
                  )}
                </div>
                {form.confirm && !passwordMatch && (
                  <p className="text-red-400/70 text-[10px] mt-1.5 ml-1">Keyphrases do not match</p>
                )}
              </div>
              {error && <p className="text-red-400/80 text-xs">{error}</p>}

              {/* Terms */}
              <p className="text-[#8b93a6] text-[11px] leading-relaxed">
                By registering you agree to our{" "}
                <Link href="#" className="text-[#f97316] hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="#" className="text-[#f97316] hover:underline">Privacy Policy</Link>.
              </p>

              {/* Submit */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                disabled={isSubmitting}
                className="cursor-pointer w-full bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black text-sm py-3.5 rounded-xl tracking-widest uppercase transition-all shadow-lg shadow-[#f97316]/20"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </motion.button>
            </form>

            {/* Login link */}
            <p className="text-center text-[#8b93a6] text-xs mt-5">
              Already an architect?{" "}
              <Link href="/login" className="text-white font-semibold hover:text-[#f97316] transition-colors">
                Login Here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}