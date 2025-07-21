
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Influencer, SearchParams, City } from "@/types";
import { InfluencerSearchForm } from "@/components/influencer-search-form";
import { InfluencerResultsTable } from "@/components/influencer-results-table";
import { searchInfluencers, getCities } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export default function InfluenceFinderPage() {
  const [results, setResults] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCities() {
      try {
        const cityList = await getCities();
        setCities(cityList);
      } catch (e) {
        toast({
            variant: "destructive",
            title: "Error fetching cities",
            description: "Could not load cities from the database.",
        });
      }
    }
    fetchCities();
  }, [toast]);


  const handleSearch = useCallback(async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchInfluencers(params);
      if (response.error) {
        setError(response.error);
        setResults([]);
      } else {
        setResults(response.data || []);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="lg:col-span-1">
        <div className="sticky top-6">
          <h2 className="text-xl font-semibold mb-4 font-headline">
            Search Filters
          </h2>
          <InfluencerSearchForm
            onSearch={handleSearch}
            isLoading={isLoading}
            cities={cities}
          />
        </div>
      </aside>
      <div className="lg:col-span-3">
        <InfluencerResultsTable
          influencers={results}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
