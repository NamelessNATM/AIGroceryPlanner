import OptionGroup from "./OptionGroup.jsx";

const MEAL_FREQUENCY_OPTIONS = [
  { value: "1_bulk", label: "1 bulk meal/day" },
  { value: "2_meals", label: "2 meals/day" },
  { value: "3_meals", label: "3 meals/day" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
  { value: "ps", label: "Pashto" },
];

export default function ParametersPanel({ value, onChange }) {
  const v = value ?? {};

  return (
    <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-900/40 p-6 shadow-xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Parameters</h2>
        <p className="text-sm text-gray-400">
          Tell us about your household and preferences.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-200">People</span>
            <input
              className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="number"
              min={1}
              step={1}
              value={v.peopleCount ?? 1}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                const peopleCount = Number.isFinite(n) ? Math.max(1, n) : 1;
                onChange?.({ ...v, peopleCount });
              }}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-200">
              Weekly budget
            </span>
            <input
              className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="number"
              inputMode="decimal"
              placeholder="e.g., 4500"
              value={v.weeklyBudget ?? ""}
              onChange={(e) =>
                onChange?.({ ...v, weeklyBudget: e.target.value })
              }
            />
          </label>
        </div>

        <OptionGroup
          label="Meal frequency"
          value={v.mealFrequency}
          options={MEAL_FREQUENCY_OPTIONS}
          onChange={(mealFrequency) => onChange?.({ ...v, mealFrequency })}
        />

        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-200">
            Dietary exclusions
          </span>
          <input
            className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="text"
            placeholder="e.g., peanuts, dairy, eggs…"
            value={v.dietaryExclusions ?? ""}
            onChange={(e) =>
              onChange?.({ ...v, dietaryExclusions: e.target.value })
            }
          />
        </label>

        <OptionGroup
          label="Language"
          value={v.language}
          options={LANGUAGE_OPTIONS}
          onChange={(language) => onChange?.({ ...v, language })}
        />
      </div>
    </div>
  );
}

