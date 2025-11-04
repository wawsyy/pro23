"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function SiteNav() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/20 bg-white/80 px-6 py-4 shadow-lg shadow-gray-200">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/triplock-logo.svg" alt="TripLock logo" width={36} height={36} priority />
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">TripLock</p>
          <p className="text-base font-semibold text-slate-900">Encrypted Planner</p>
        </div>
      </Link>
      <ConnectButton
        label="Launch control"
        accountStatus="avatar"
        chainStatus="icon"
        showBalance={false}
      />
    </header>
  );
}

