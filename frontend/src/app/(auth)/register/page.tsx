"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Github, Chrome, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/store/store";
import { registerUser } from "@/src/store/slices/authSlice";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};
const DISPLAY: React.CSSProperties = {
  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
};

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { registerLoading, registerError } = useSelector(
    (state: RootState) => state.auth,
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  const passwordMatch =
    form.password && form.confirm && form.password === form.confirm;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!form.name || form.name.length < 2) errors.name = "Name must be at least 2 characters.";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email.";
    if (!form.password || form.password.length < 6) errors.password = "Password must be at least 6 characters.";
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!passwordMatch) return;

    try {
      await dispatch(
        registerUser({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      ).unwrap();

      router.push("/login");
    } catch (err: any) {
      if (err?.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    }
  };

  const handleOAuth = (provider: "github" | "google") => {
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT PANEL */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative hidden lg:flex flex-col justify-between border-r border-[#2A2A2E] p-20 overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,.72), rgba(0,0,0,.72)), url('/images/auth-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#c09292] mb-4">
              SYSTEM ARCHITECTURE
            </p>

            <h1 className="text-8xl font-black tracking-tight leading-none">
              PLANEX
            </h1>
          </div>

          <div className="relative z-10 max-w-lg">
            <div className="w-16 h-px bg-[#c09292] mb-8" />

            <blockquote className="text-3xl italic leading-relaxed text-[#E4E4E7]">
              “Good architecture is not built from complexity. It emerges from
              clarity.”
            </blockquote>

            <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-[#71717A]">
              PLANEX SYSTEMS
            </p>
          </div>

          <div className="relative z-10 flex justify-between text-[10px] uppercase tracking-[0.25em] text-[#52525B]">
            <div>
              <p>VER: 1.0.0</p>
              <p className="mt-1">STATUS: OPERATIONAL</p>
            </div>

            <div className="border border-[#2A2A2E] p-4">
              <div className="grid grid-cols-2 gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-[#FF5D1F]" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT PANEL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex bg-[#0f0f0f] items-center justify-center px-8 py-10 overflow-y-auto"
        >
          <div className="w-full max-w-md">
            {/* Tab strip */}
            <div className="mb-8 flex gap-8 border-b border-[#262626] pb-4">
              <Link
                href="/login"
                className="pb-2 text-[11px] uppercase tracking-[0.3em] text-[#71717A] hover:text-[#fafafa] transition-colors duration-150"
                style={MONO}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="border-b-2 border-[#FF5D1F] pb-2 text-[11px] uppercase tracking-[0.3em]"
                style={MONO}
              >
                Sign Up
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-5xl font-semibold" style={DISPLAY}>
                Create Workspace
              </h2>
              <p className="mt-3 text-[#A1A1AA]">
                Register your architect identity to start building.
              </p>
            </div>

            {/* Error */}
            {registerError  && (
              <div
                className="mb-6 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                style={MONO}
              >
                {registerError }
              </div>
            )}

            <form onSubmit={handleRegister}>
              {/* Name */}
              <div className="mb-4">
                <label
                  className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[#737373]"
                  style={MONO}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Your architect name"
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                  className={`w-full h-12 border ${fieldErrors.name ? "border-red-500/60" : "border-[#d6d6d6] focus:border-[#ff3d00]"} bg-[#f3f3f3] px-4 text-sm text-[#111111] placeholder-[#b0b0b0] outline-none transition-colors duration-150`}
                  style={MONO}
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-[12px] text-red-500/90">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label
                  className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-[#737373]"
                  style={MONO}
                >
                  Identifier
                </label>
                <input
                  type="email"
                  placeholder="architect@planex.dev"
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                  className={`w-full h-12 border ${fieldErrors.email ? "border-red-500/60" : "border-[#d6d6d6] focus:border-[#ff3d00]"} bg-[#f3f3f3] px-4 text-sm text-[#111111] placeholder-[#b0b0b0] outline-none transition-colors duration-150`}
                  style={MONO}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-[12px] text-red-500/90">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label
                  className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-[#737373]"
                  style={MONO}
                >
                  Password
                </label>
                <div className={`flex h-12 items-center border ${fieldErrors.password ? "border-red-500/60" : "border-[#d6d6d6] focus-within:border-[#ff3d00]"} bg-[#f3f3f3] px-4 transition-colors duration-150`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange("password")}
                    required
                    className="w-full bg-transparent text-sm text-[#111111] placeholder-[#737373] outline-none"
                    style={MONO}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#737373] hover:text-[#fafafa] transition-colors duration-150 shrink-0"
                  >
                    {showPassword ? (
                      <EyeOff size={15} strokeWidth={1.5} />
                    ) : (
                      <Eye size={15} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-[12px] text-red-500/90">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm password */}
              <div className="mb-3">
                <div className="flex justify-between mb-2">
                  <label
                    className="text-[10px] uppercase tracking-[0.25em] text-[#737373]"
                    style={MONO}
                  >
                    Confirm Password
                  </label>
                </div>
                <div
                  className={`flex h-12 items-center border bg-[#f3f3f3] px-4 focus-within:border-[#ff3d00] transition-colors duration-150 ${
                    form.confirm && !passwordMatch
                      ? "border-red-500/60"
                      : "border-[#262626]"
                  }`}
                >
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={handleChange("confirm")}
                    required
                    className="w-full bg-transparent text-sm text-[#111111] placeholder-[#737373] outline-none"
                    style={MONO}
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    {passwordMatch && (
                      <CheckCircle2
                        size={14}
                        strokeWidth={1.5}
                        className="text-[#22c55e]"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-[#737373] hover:text-[#fafafa] transition-colors duration-150"
                    >
                      {showConfirm ? (
                        <EyeOff size={15} strokeWidth={1.5} />
                      ) : (
                        <Eye size={15} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>
                {form.confirm && !passwordMatch && (
                  <p
                    className="mt-1.5 text-[12px] text-red-400/80"
                    style={MONO}
                  >
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Terms */}
              <p
                className="mb-6 text-[11px] text-[#71717A] leading-relaxed"
                style={MONO}
              >
                By registering you agree to our{" "}
                <Link href="#" className="text-[#FF5D1F] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-[#FF5D1F] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={registerLoading}
                className="w-full border-t border-b border-[#FF5D1F] py-4 text-[11px] uppercase tracking-[0.3em] text-[#FF5D1F] hover:bg-[#FF5D1F] hover:text-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                style={MONO}
              >
                {registerLoading ? "Registering..." : "Create Account"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#262626]" />
              <span
                className="text-[11px] uppercase tracking-[0.25em] text-[#737373]"
                style={MONO}
              >
                Or Protocol
              </span>
              <div className="flex-1 h-px bg-[#262626]" />
            </div>

            {/* OAuth */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                className="w-full h-12 border border-[#2A2A2E] flex items-center justify-center gap-2 hover:border-[#FF5D1F] cursor-pointer"
              >
                <Github size={16} />
                SINGLE SIGN-ON (GITHUB)
              </button>

              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="w-full h-12 border border-[#2A2A2E] flex items-center justify-center gap-2 hover:border-[#FF5D1F] cursor-pointer"
              >
                <Chrome size={16} />
                SINGLE SIGN-ON (GOOGLE)
              </button>
            </div>

            {/* Footer */}
            <div className="mt-12 flex justify-between text-[10px] uppercase tracking-[0.25em] text-[#52525B]">
              <span>© 2026 PLANEX SYSTEMS</span>

              <div className="flex gap-6">
                <span>SECURITY</span>
                <span>LEGAL</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
