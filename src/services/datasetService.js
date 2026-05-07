import { getLocationIndex } from "./locationData.js";

export function getDatasetForLocation(countryCode, citySlug) {
  if (countryCode == null || citySlug == null) return null;

  const key = `${countryCode}/${citySlug}`;
  return getLocationIndex().cityDataByKey[key] ?? null;
}

