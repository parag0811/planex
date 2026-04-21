"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit3,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { createProject } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

export default function CreateProjectPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const createState = useSelector((state: RootState) => state.project.create);
  const [projectName, setProjectName] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const validateProjectName = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Project name is required.";
    }

    if (trimmed.length < 3) {
      return "Project name must be at least 3 characters.";
    }

    if (trimmed.length > 50) {
      return "Project name must be 50 characters or fewer.";
    }

    return null;
  };

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validateProjectName(projectName);

    if (validationMessage) {
      setClientError(validationMessage);
      return;
    }

    setClientError(null);
    setIsSubmitting(true);

    try {
      await dispatch(createProject({ name: projectName.trim() })).unwrap();
      router.push("/projects");
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070c] pt-28 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#8b93a6] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-semibold">Back to Projects</span>
        </motion.button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#10141d] border border-white/10 rounded-2xl p-8 md:p-12"
        >
          {/* Header */}
          <div className="mb-8">
            <p className="text-[#8b93a6] text-sm font-semibold uppercase tracking-widest mb-3">
              Create New Project
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Initialize Workspace
            </h1>
            <p className="text-[#8b93a6] text-sm">
              Set up a new project to start building and planning your next system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateProject} className="flex flex-col gap-6">
            {/* Project Name Field */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-semibold text-white uppercase tracking-widest">
                Project Name
              </label>

              <motion.div
                animate={{
                  boxShadow: isFocused
                    ? "0 0 0 1px #f97316, 0 0 20px rgba(249,115,22,0.15)"
                    : "0 0 0 1px rgba(255,255,255,0.07)",
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 bg-[#0b0f16] rounded-lg px-4 py-3 border border-white/10"
              >
                <Edit3 size={18} className="text-[#8b93a6] shrink-0" />
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g. Project Obsidian"
                  className="flex-1 bg-transparent border-none outline-none text-base font-medium text-white placeholder:text-[#6b7280]"
                />
                <AnimatePresence>
                  {projectName && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0"
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {(clientError || createState.error) && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-sm text-red-400"
                  >
                    {clientError ?? createState.error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Info Box */}
            <div className="bg-[#0b0f16] border border-white/5 rounded-lg p-4 mb-2">
              <p className="text-[#8b93a6] text-sm leading-relaxed">
                Your project workspace will be initialized with default settings. You can customize everything after creation.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-[#0b0f16] hover:bg-[#1a2130] border border-white/10 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={!projectName.trim() || isSubmitting || createState.loading}
                whileHover={projectName.trim() ? { scale: 1.02 } : {}}
                whileTap={projectName.trim() ? { scale: 0.98 } : {}}
                className={`
                  flex-1 relative py-3 px-6 rounded-lg overflow-hidden
                  font-semibold transition-all duration-200 flex items-center justify-center gap-2
                  ${!projectName.trim() ? "opacity-50 cursor-not-allowed bg-[#8b7355]" : "bg-[#f97316] hover:bg-[#ea6c0a] cursor-pointer"}
                  ${isSubmitting || createState.loading ? "cursor-wait" : ""}
                `}
              >
                {isSubmitting || createState.loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Create Project</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-[#6b7280] text-xs">
            Projects are created instantly and can be accessed from your dashboard.
          </p>
        </motion.div>
      </div>
    </div>
  );
}