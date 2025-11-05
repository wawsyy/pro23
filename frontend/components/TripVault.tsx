"use client";

import { TRAVEL_STYLES } from "@/lib/travelStyles";

export type TripSummary = {
  id: number;
  title: string;
  style: number;
  createdAt: string;
};

export type DecryptedTrip = {
  id: number;
  title: string;
  style: number;
  route: string;
  schedule: string;
  createdAt: string;
};

type Props = {
  trips: TripSummary[];
  decryptedTrip?: DecryptedTrip | null;
  onDecrypt: (tripId: number) => Promise<void>;
  pending: boolean;
  disabled: boolean;
};

export function TripVault({ trips, decryptedTrip, onDecrypt, pending, disabled }: Props) {
  return (
    <section className="rounded-3xl border border-white/20 bg-white/75 p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Private vault</p>
          <h2 className="text-2xl font-semibold text-slate-900">Encrypted itineraries</h2>
        </div>
        <p className="text-sm text-slate-500">
          Stored trips:&nbsp;
          <span className="font-semibold text-slate-800">{trips.length}</span>
        </p>
      </div>

      {trips.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          No confidential trips yet. Create one above to see it here.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {trips.map((trip) => {
            const style = TRAVEL_STYLES.find((s) => s.id === trip.style);
            return (
              <li
                key={trip.id}
                className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200/80"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{trip.createdAt}</p>
                    <p className="text-lg font-semibold text-slate-900">{trip.title}</p>
                    <p className="text-sm text-slate-500">{style?.label ?? "Unknown style"}</p>
                  </div>
                  <button
                    disabled={disabled || pending}
                    onClick={() => onDecrypt(trip.id)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? "Decrypting..." : "Decrypt locally"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {decryptedTrip && (
        <div className="mt-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 p-5">
          <p className="text-sm uppercase tracking-wide text-blue-500">Decrypted locally</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{decryptedTrip.title}</h3>
          <p className="text-sm text-slate-500">{decryptedTrip.createdAt}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/40 bg-white/70 p-4">
              <h4 className="text-sm font-semibold text-slate-700">Route briefing</h4>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{decryptedTrip.route}</p>
            </div>
            <div className="rounded-2xl border border-white/40 bg-white/70 p-4">
              <h4 className="text-sm font-semibold text-slate-700">Timeline</h4>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
                {decryptedTrip.schedule}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

