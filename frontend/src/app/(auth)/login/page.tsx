"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AtSign, Lock, Github, Chrome, Eye, EyeOff, Zap, Shield, Cpu, Globe } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/src/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [persist, setPersist] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (err: any) {
      setError(err || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1200] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#f97316]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#f97316]/4 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* ── LEFT — Branding ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="hidden lg:flex flex-col justify-between h-full py-4"
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

          {/* Big headline */}
          <div className="my-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
              className="text-[72px] font-black leading-[0.92] tracking-tighter uppercase"
            >
              <span className="text-white">BUILD</span>
              <br />
              <span className="text-[#f97316]">BETTER</span>
              <br />
              <span className="text-white">SYSTEMS.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
              className="text-[#a89880] text-sm leading-relaxed mt-6 max-w-xs"
            >
              Enter the forge. Secure your project room. The kinetic architect's environment for high-performance neural engineering.
            </motion.p>
          </div>

          {/* Status bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
            className="flex items-center gap-10 border-t border-white/5 pt-6"
          >
            {[
              { label: "STATUS", value: "SYSTEM ONLINE", icon: <Shield size={12} />, color: "text-[#4ade80]" },
              { label: "ENCRYPTED", value: "AES-256-GCM", icon: <Lock size={12} />, color: "text-[#f97316]" },
              { label: "LATENCY", value: "12MS GLOBAL", icon: <Globe size={12} />, color: "text-[#60a5fa]" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mb-1 ${s.color}`}>
                  {s.icon}{s.label}
                </p>
                <p className="text-white text-xs font-bold">{s.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Bottom meta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <p className="text-[#3a2a1a] text-[10px] font-mono leading-relaxed">
              PLANEX_AI_AUTH_GUARD_v2.4.0<br />
              SECURE_HOSTNAME: [✓]<br />
              ENCRYPTION_MODULE: [ACTIVE]
            </p>
          </motion.div>
        </motion.div>

        {/* RIGHT — Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="w-full max-w-md mx-auto"
        >
          <form onSubmit={handleSubmit} className="bg-[#1e1600]/80 border border-white/8 rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-black/40 relative">

            {/* Grid icon top-right */}
            <div className="absolute top-5 right-5 grid grid-cols-2 gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-sm bg-[#f97316]/40" />
              ))}
            </div>

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-white text-xl font-bold tracking-tight">Initialize Session</h2>
              <p className="text-[#6b5c4c] text-sm mt-1">Choose your authentication protocol.</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* OAuth buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer w-full flex items-center justify-center gap-3 bg-[#2a2a2a] hover:bg-[#333] border border-white/10 text-white font-semibold text-sm py-3 rounded-xl transition-all"
              >
                <Github size={17} />
                Continue with GitHub
              </motion.button>
              <motion.button
                type="button"
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
              <span className="text-[#4a3a2a] text-[10px] font-bold uppercase tracking-widest">Secondary Link</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="text-[#f97316] text-[10px] font-bold uppercase tracking-widest block mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 bg-[#110d00] border border-white/8 focus-within:border-[#f97316]/50 rounded-xl px-4 py-3 transition-colors">
                <AtSign size={14} className="text-[#4a3a2a] shrink-0" />
                <input
                  type="email"
                  placeholder="architect@planex.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-white text-sm placeholder-[#3a2a1a] outline-none w-full"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="text-[#f97316] text-[10px] font-bold uppercase tracking-widest block mb-2">
                Password
              </label>
              <div className="flex items-center gap-3 bg-[#110d00] border border-white/8 focus-within:border-[#f97316]/50 rounded-xl px-4 py-3 transition-colors">
                <Lock size={14} className="text-[#4a3a2a] shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-white text-sm placeholder-[#3a2a1a] outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#4a3a2a] hover:text-[#f97316] transition-colors shrink-0"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Persist + Lost key */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  role="checkbox"
                  aria-checked={persist}
                  tabIndex={0}
                  onClick={() => setPersist(!persist)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                    persist ? "bg-[#f97316] border-[#f97316]" : "border-white/20 bg-transparent"
                  }`}
                >
                  {persist && <div className="w-2 h-2 rounded-sm bg-black" />}
                </div>
                <span className="text-[#6b5c4c] text-xs group-hover:text-white transition-colors">
                  Persist session
                </span>
              </label>
              <Link href="#" className="text-[#f97316] text-xs hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              disabled={loading}
              className="w-full bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-70 disabled:cursor-not-allowed text-black font-black text-sm py-3.5 rounded-xl tracking-widest uppercase transition-all shadow-lg shadow-[#f97316]/20"
            >
              {loading ? "Authenticating..." : "Engage System"}
            </motion.button>

            {/* Register link */}
            <p className="text-center text-[#4a3a2a] text-xs mt-5">
              New architect?{" "}
              <Link href="/register" className="text-white font-semibold hover:text-[#f97316] transition-colors">
                Register new identity
              </Link>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Bottom-right binary decoration */}
      <div className="absolute bottom-4 right-6 text-[#2a1a00] text-[10px] font-mono hidden lg:block select-none">
        01001110 01000101 11010101 01001110<br />
        100 01 71267 0. 132-4201
      </div>
    </div>
  );
}