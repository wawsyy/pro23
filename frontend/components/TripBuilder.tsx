"use client";

import { useMemo, useState } from "react";
import { TRAVEL_STYLES } from "@/lib/travelStyles";
import { calculateNights } from "@/lib/encryption";

export type TripFormValues = {
  title: string;
  style: number;
  startDate: string;
  endDate: string;
  destinations: string;
  plan: string;
};

type Props = {
  disabled: boolean;
  pending: boolean;
  onSubmit: (values: TripFormValues) => Promise<void>;
};

const initialState: TripFormValues = {
  title: "",
  style: 0,
  startDate: "",
  endDate: "",
  destinations: "",
  plan: "",
};

export function TripBuilder({ disabled, pending, onSubmit }: Props) {
  const [form, setForm] = useState<TripFormValues>(initialState);

  const nights = useMemo(
    () => calculateNights(form.startDate, form.endDate),
    [form.startDate, form.endDate],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "style" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(form);
    setForm(initialState);
  };

  return (
    <section className="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-xl shadow-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Create itinerary</p>
          <h2 className="text-2xl font-semibold text-slate-900">Secure Trip Builder</h2>
        </div>
        <p className="text-sm text-slate-500">
          Nights encrypted:&nbsp;
          <span className="font-semibold text-slate-800">{nights || "—"}</span>
        </p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Trip title</span>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Hidden Alps Recon"
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Travel style</span>
            <select
              name="style"
              value={form.style}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {TRAVEL_STYLES.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Start date</span>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              lang="en"
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">End date</span>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              required
              lang="en"
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Destinations & logistics</span>
          <textarea
            name="destinations"
            value={form.destinations}
            onChange={handleChange}
            required
            rows={3}
            placeholder="Milano → Andermatt → Zermatt. Include transfers, stay preferences, risk notes..."
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Activities timeline</span>
          <textarea
            name="plan"
            value={form.plan}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Day 1: scouting, Day 2: off-grid trek, Day 3: fallback day..."
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <button
          type="submit"
          disabled={disabled || pending}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Encrypting & storing..." : "Publish encrypted itinerary"}
        </button>
      </form>
    </section>
  );
}

