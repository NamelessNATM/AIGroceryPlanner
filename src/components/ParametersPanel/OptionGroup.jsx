export default function OptionGroup({ label, value, options, onChange }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-gray-200">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange?.(opt.value)}
              className={[
                "rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500",
                selected
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                  : "border-gray-800 bg-gray-950 text-gray-200 hover:border-gray-700",
              ].join(" ")}
              aria-pressed={selected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

