export default function CountryCitySelector({
  value,
  onChange,
  countries,
  citiesByCountry,
}) {
  const countryCode = value?.countryCode ?? null;
  const citySlug = value?.citySlug ?? null;

  const cityOptions = countryCode ? citiesByCountry?.[countryCode] ?? [] : [];

  return (
    <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-900/40 p-6 shadow-xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Choose your city</h2>
        <p className="text-sm text-gray-400">
          Pick a country first, then select a city dataset.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-200">Country</span>
          <select
            className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={countryCode ?? ""}
            onChange={(e) => {
              const nextCountryCode = e.target.value || null;
              onChange?.({ countryCode: nextCountryCode, citySlug: null });
            }}
          >
            <option value="" disabled>
              Select a country…
            </option>
            {(countries ?? []).map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-200">City</span>
          <select
            className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            value={citySlug ?? ""}
            disabled={!countryCode}
            onChange={(e) => {
              const nextCitySlug = e.target.value || null;
              onChange?.({ countryCode, citySlug: nextCitySlug });
            }}
          >
            <option value="" disabled>
              {countryCode ? "Select a city…" : "Select a country first…"}
            </option>
            {cityOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950/40 p-4 text-sm text-gray-300">
        <div className="grid gap-1">
          <div>
            <span className="text-gray-400">Selected country code:</span>{" "}
            <span className="font-mono">{countryCode ?? "—"}</span>
          </div>
          <div>
            <span className="text-gray-400">Selected city slug:</span>{" "}
            <span className="font-mono">{citySlug ?? "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

