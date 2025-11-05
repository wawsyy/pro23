const steps = [
  {
    title: "Author your private plan",
    detail: "Collect destinations, slots and activities in the builder. Nothing travels in clear.",
  },
  {
    title: "Encrypt locally",
    detail: "We derive an AES-GCM workspace key in your browser before sharing ciphertext on-chain.",
  },
  {
    title: "Store + analyse with FHE",
    detail: "The contract stores payloads and updates homomorphic counters for style analytics.",
  },
  {
    title: "Decrypt on demand",
    detail: "Only wallets that you authorise can request the ciphertext and FHE handles for decryption.",
  },
];

export function WorkflowSteps() {
  return (
    <section className="grid gap-4 rounded-3xl border border-white/20 bg-white/60 p-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, idx) => (
        <div key={step.title} className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-500">0{idx + 1}</span>
          <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
          <p className="text-sm text-slate-600">{step.detail}</p>
        </div>
      ))}
    </section>
  );
}

