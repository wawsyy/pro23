"use client";

import { TRAVEL_STYLES } from "@/lib/travelStyles";

export type InsightCard = {
  styleId: number;
  tripsHandle: string;
  nightsHandle: string;
  decryptedTrips?: string;
  decryptedNights?: string;
};

type Props = {
  cards: InsightCard[];
  onDecrypt: (styleId: number) => Promise<void>;
  onUnlock: (styleId: number) => Promise<void>;
  decryptingStyle?: number;
  unlockingStyle?: number;
  disabled: boolean;
};

export function InsightBoard({
  cards,
  onDecrypt,
  onUnlock,
  decryptingStyle,
  unlockingStyle,
  disabled,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Encrypted analytics</p>
          <h2 className="text-2xl font-semibold text-slate-900">Style insights</h2>
        </div>
        <p className="text-sm text-slate-500">
          FHE handles are refreshed automatically after each submission.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const style = TRAVEL_STYLES.find((s) => s.id === card.styleId);
          return (
            <div
              key={card.styleId}
              className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500">{style?.label}</p>
                  <h3 className="text-xl font-semibold text-slate-900">Trips hidden: {card.decryptedTrips ?? "•••"}</h3>
                  <p className="text-sm text-slate-500">
                    Nights logged: {card.decryptedNights ?? "•••"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    disabled={disabled || unlockingStyle === card.styleId}
                    onClick={() => onUnlock(card.styleId)}
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unlockingStyle === card.styleId ? "Authorising..." : "Grant access"}
                  </button>
                  <button
                    disabled={disabled || decryptingStyle === card.styleId}
                    onClick={() => onDecrypt(card.styleId)}
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {decryptingStyle === card.styleId ? "Decrypting..." : "Decrypt stats"}
                  </button>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                <p>
                  Trips handle: <span className="font-mono">{card.tripsHandle}</span>
                </p>
                <p className="mt-1">
                  Nights handle: <span className="font-mono">{card.nightsHandle}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

