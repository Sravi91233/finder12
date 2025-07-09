"use client";

import { useState } from "react";
import type { Influencer, SearchParams } from "@/types";
import { InfluencerSearchForm } from "@/components/influencer-search-form";
import { InfluencerResultsTable } from "@/components/influencer-results-table";
import { Icons } from "@/components/icons";
import { searchInfluencers } from "@/app/actions";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [results, setResults] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: SearchParams) => {
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
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="p-4 md:p-6 border-b bg-card">
        <div className="container mx-auto flex items-center gap-4">
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary font-headline">
            InfluenceFinder
          </h1>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="sticky top-6">
              <h2 className="text-xl font-semibold mb-4 font-headline">
                Search Filters
              </h2>
              <InfluencerSearchForm
                onSearch={handleSearch}
                isLoading={isLoading}
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
      </main>
      <footer className="p-4 md:p-6 mt-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <Separator className="mb-4" />
          <p>
            Built with Next.js and ShadCN. Powered by Ylytic API on RapidAPI.
          </p>
        </div>
      </footer>
    </div>
  );
}
