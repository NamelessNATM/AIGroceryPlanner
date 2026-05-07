import { useEffect, useMemo, useState } from "react";
import CountryCitySelector from "./components/CountryCitySelector.jsx";
import { getLocationIndex } from "./services/locationData.js";
import { getDatasetForLocation } from "./services/datasetService.js";

export default function App() {
  const { countries, citiesByCountry } = useMemo(() => getLocationIndex(), []);

  const [locationSelection, setLocationSelection] = useState({
    countryCode: null,
    citySlug: null,
  });

  const [selectedDataset, setSelectedDataset] = useState(null);

  useEffect(() => {
    const { countryCode, citySlug } = locationSelection ?? {};
    if (countryCode != null && citySlug != null) {
      setSelectedDataset(getDatasetForLocation(countryCode, citySlug));
    } else {
      setSelectedDataset(null);
    }
  }, [locationSelection]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-16">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400">
            AI Grocery Planner
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Select a location to load the correct price dataset.
          </p>
        </header>

        <CountryCitySelector
          value={locationSelection}
          onChange={setLocationSelection}
          countries={countries}
          citiesByCountry={citiesByCountry}
          selectedDataset={selectedDataset}
        />
      </div>
    </div>
  );
}
