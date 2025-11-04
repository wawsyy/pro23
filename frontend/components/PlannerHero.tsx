"use client";

import { motion } from "framer-motion";

type Props = {
  chainName?: string;
  contractAddress?: `0x${string}` | undefined;
};

export function PlannerHero({ chainName, contractAddress }: Props) {
  return (
    <section className="space-y-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl border border-white/10 bg-white/70 p-8 shadow-2xl shadow-gray-200 backdrop-blur"
      >
        <p className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-1 text-sm font-medium text-slate-700">
          <span className="size-2 rounded-full bg-blue-500" />
          Private itinerary lab • Fully homomorphic by design
        </p>
        <h1 className="mt-6 text-4xl font-semibold text-slate-900 md:text-5xl">
          Encrypted Trip Planner
        </h1>
        <p className="mt-4 text-lg text-slate-600 md:w-3/4">
          Draft routes, track schedules and generate travel intelligence without exposing your
          calendar. Everything is encrypted locally, stored on-chain, and decrypted only on the
          devices you trust.
        </p>
        <dl className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/40 bg-white/60 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Active network</dt>
            <dd className="font-medium text-slate-800">{chainName ?? "Wallet not connected"}</dd>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/60 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Planner contract</dt>
            <dd className="font-mono text-xs text-slate-700">
              {contractAddress ?? "Awaiting deployment"}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/60 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Security posture</dt>
            <dd className="font-medium text-slate-800">FHE storage + local AES-GCM</dd>
          </div>
        </dl>
      </motion.div>
    </section>
  );
}

