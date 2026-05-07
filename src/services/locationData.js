function titleCaseFromSlug(slug) {
  if (!slug) return "";
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/g)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function parseLocationFromPath(path) {
  const parts = String(path).split("/").filter(Boolean);
  const file = parts.at(-1) ?? "";
  const countryCode = parts.at(-2) ?? "";
  const citySlug = file.replace(/\.json$/i, "");
  return { countryCode, citySlug };
}

function buildIndex() {
  const modules = import.meta.glob("../../data/**/*.json", { eager: true });

  /** @type {Map<string, {code: string, label: string}>} */
  const countriesByCode = new Map();
  /** @type {Record<string, Array<{slug: string, label: string, path: string}>>} */
  const citiesByCountry = {};
  /** @type {Record<string, any>} */
  const cityDataByKey = {};

  for (const [path, mod] of Object.entries(modules)) {
    const json = mod?.default ?? mod;
    const { countryCode, citySlug } = parseLocationFromPath(path);
    if (!countryCode || !citySlug) continue;

    const countryLabel =
      json?.meta?.country?.trim?.() || countryCode.toUpperCase();
    const cityLabel = json?.meta?.city?.trim?.() || titleCaseFromSlug(citySlug);

    if (!countriesByCode.has(countryCode)) {
      countriesByCode.set(countryCode, { code: countryCode, label: countryLabel });
    }

    (citiesByCountry[countryCode] ??= []).push({
      slug: citySlug,
      label: cityLabel,
      path,
    });

    cityDataByKey[`${countryCode}/${citySlug}`] = json;
  }

  const countries = Array.from(countriesByCode.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  for (const [countryCode, cities] of Object.entries(citiesByCountry)) {
    cities.sort((a, b) => a.label.localeCompare(b.label));
    citiesByCountry[countryCode] = cities;
  }

  return { countries, citiesByCountry, cityDataByKey };
}

let cachedIndex = null;

export function getLocationIndex() {
  if (cachedIndex) return cachedIndex;
  cachedIndex = buildIndex();
  return cachedIndex;
}

