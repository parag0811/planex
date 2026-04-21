"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  ArrowUpRight,
  Database,
  Globe,
  Shield,
  Zap,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects } from "@/src/store/slices/projectSlice";
import type { RootState, AppDispatch } from "@/src/store/store";
import ProjectsFooter from "@/src/components/layout/ProjectsFooter";

export default function ProjectsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading } = useSelector(
    (state: RootState) => state.project,
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [projects, searchTerm]);

  const getProjectIcon = (index: number) => {
    const icons = [Database, Globe, Shield, Zap];
    const Icon = icons[index % icons.length];
    return <Icon size={24} className="text-[#f97316]" />;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-[#06070c] pt-28">
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Header */}
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8b93a6] text-sm font-semibold uppercase tracking-widest mb-2">
                System Overview
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Active Projects
              </h1>
            </div>
            <button
              onClick={() => router.push("/projects/create-project")}
              className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-black font-bold px-6 py-3 rounded-lg transition-colors duration-200"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b93a6]"
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0f16] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#f97316]/50 transition-colors"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className="bg-[#10141d] border border-white/10 rounded-2xl p-6 hover:border-[#f97316]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#f97316]/10 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[#1a2130] rounded-lg group-hover:bg-[#f97316]/10 transition-colors">
                  {getProjectIcon(index)}
                </div>
                <ExternalLink
                  size={16}
                  className="text-[#6b7280] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>

              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {String(project.name || "")}
              </h3>

              <p className="text-[#8b93a6] text-sm mb-6 line-clamp-2">
                {String((project as any).description || "No description provided")}
              </p>

              {/* Metrics */}
              <div className="flex items-center gap-6 pb-6 border-b border-white/5 mb-6">
                <div>
                  <p className="text-[#6b7280] text-xs uppercase tracking-widest">
                    Status
                  </p>
                  <p className="text-white font-semibold">
                    {String((project as any).status || "Active")}
                  </p>
                </div>
                <div>
                  <p className="text-[#6b7280] text-xs uppercase tracking-widest">
                    Members
                  </p>
                  <p className="text-white font-semibold">
                    {String((project as any).members_count || 1)}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {(project as any).tags && Array.isArray((project as any).tags) && (project as any).tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {((project as any).tags as string[]).slice(0, 2).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#1a2130] text-[#f97316] px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button className="w-full bg-[#0b0f16] hover:bg-[#1a2130] text-[#f97316] font-semibold py-2 rounded-lg transition-colors">
                View Details
              </button>
            </motion.div>
          ))}
        </motion.div>

        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-[#8b93a6] text-lg">
              {searchTerm
                ? "No projects match your search"
                : "No projects yet. Create your first project to get started."}
            </p>
          </div>
        )}

        {/* Ready to scale section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-linear-to-r from-[#10141d] to-[#1a2130] border border-white/10 rounded-2xl p-8 md:p-12 mb-20"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to scale?
              </h2>
              <p className="text-[#8b93a6] mb-6 max-w-md">
                Unlock advanced features, team collaboration, and enterprise-grade infrastructure to power your development pipeline.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button className="px-6 py-3 bg-[#0b0f16] hover:bg-[#1a2130] border border-white/10 text-white font-semibold rounded-lg transition-colors">
                Documentation
              </button>
              <button className="px-6 py-3 bg-[#f97316] hover:bg-[#ea6c0a] text-black font-semibold rounded-lg transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <ProjectsFooter />
    </div>
  );
}
