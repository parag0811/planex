"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Github, Chrome, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/src/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { loginLoading, error } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Enter a valid email.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await dispatch(loginUser({ email, password })).unwrap();
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
    <div className="min-h-screen bg-[#0b0b0c] text-[#FAFAFA]">
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
              <p>STATUS: OPERATIONAL</p>
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
          className="flex bg-[#0F0F11] items-center justify-center px-8 py-12"
        >
          <div className="w-full max-w-md">
            <div className="mb-14 flex gap-8 border-b border-[#2A2A2E] pb-4">
              <Link
                href="/login"
                className="border-b border-[#FF5D1F] pb-2 text-[11px] uppercase tracking-[0.3em]"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="pb-2 text-[11px] uppercase tracking-[0.3em] text-[#71717A]"
              >
                Sign Up
              </Link>
            </div>

            <div className="mb-10">
              <h2 className="text-5xl font-semibold">Access Workspace</h2>

              <p className="mt-3 text-[#A1A1AA]">
                Continue building your architecture workspace.
              </p>
            </div>

            {error && (
              <div className="mb-6 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[#A1A1AA]">
                  Identifier
                </label>

                <div className={`h-12 border ${fieldErrors.email ? "border-red-500/60" : "border-[#d6d6d6] focus-within:border-[#ff3d00]"} bg-[#f3f3f3] flex items-center px-4 transition-colors`}>
                  <input
                    type="email"
                    placeholder="architect@planex.dev"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                    }}
                    className="w-full bg-transparent outline-none text-[#111111] text-sm placeholder:text-[#b0b0b0]"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1.5 text-[12px] text-red-500/90">{fieldErrors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-[#A1A1AA]">
                    Password
                  </label>

                  <Link
                    href="#"
                    className="text-[10px] uppercase tracking-[0.2em] text-[#71717A]"
                  >
                    Recovery
                  </Link>
                </div>

                <div className={`h-12 border ${fieldErrors.password ? "border-red-500/60" : "border-[#d6d6d6] focus-within:border-[#ff3d00]"} bg-[#f3f3f3] flex items-center px-4 transition-colors`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
                    }}
                    className="w-full bg-transparent outline-none text-[#111111] text-sm placeholder:text-[#b0b0b0]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#71717A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-[12px] text-red-500/90">{fieldErrors.password}</p>
                )}
              </div>



              <button
                type="submit"
                disabled={loginLoading}
                className="cursor-pointer w-full border-t border-b border-[#FF5D1F] py-4 text-[11px] uppercase tracking-[0.35em] text-[#FF5D1F] hover:bg-[#FF5D1F] hover:text-black transition-colors"
              >
                {loginLoading ? "AUTHENTICATING..." : "SIGN IN"}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#2A2A2E]" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A]">
                OR PROTOCOL
              </span>
              <div className="flex-1 h-px bg-[#2A2A2E]" />
            </div>

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
