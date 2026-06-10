"use client";

import { useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "../_components/app-header";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  compareStateAtom,
  errorAtom,
  filteredResultsAtom,
  jobDescriptionsAtom,
  loadingAtom,
  matchResultsAtom,
  searchQueryAtom,
  selectedJdAtom,
  sidebarAtom,
  sortByAtom,
  sortOrderAtom,
} from "@/store/candidatesearch-atom";

import { JobDescriptionSidebar } from "./_components/jd-sidebar";
import MatchingUsersCard from "./_components/matching-users";
import MatchingSummaryCard from "./_components/matching-summary";
import ComparePage from "./_components/comparision-view";
import { apiService } from "@/app/dashboard/_services/api-service";

export default function Home() {
  const setJobDescriptions = useSetAtom(jobDescriptionsAtom);
  const [selectedJd] = useAtom(selectedJdAtom);
  const [matchResults] = useAtom(matchResultsAtom);
  const [filteredResults, setFilteredResults] = useAtom(filteredResultsAtom);
  const setLoading = useSetAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [searchQuery] = useAtom(searchQueryAtom);
  const [sortBy] = useAtom(sortByAtom);
  const [sortOrder] = useAtom(sortOrderAtom);
  const [showSidebar] = useAtom(sidebarAtom);
  const compareState = useAtomValue(compareStateAtom);

  useEffect(() => {
    const fetchJobDescriptions = async () => {
      setLoading(true);
      try {
        const data = await apiService.getJobDescriptions();
        setJobDescriptions(data);
      } catch {
        setError("Failed to load job descriptions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobDescriptions();
  }, [setJobDescriptions, setError, setLoading]);

  const filterAndSortResults = useCallback(() => {
    let results = [...matchResults];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (match) =>
          match.name.toLowerCase().includes(query) ||
          match.email.toLowerCase().includes(query)
      );
    }

    results.sort((a, b) => {
      if (sortBy === "similarity") {
        return sortOrder === "desc"
          ? b.similarity - a.similarity
          : a.similarity - b.similarity;
      } else if (sortBy === "name") {
        return sortOrder === "desc"
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      }
      return 0;
    });

    setFilteredResults(results);
  }, [matchResults, searchQuery, sortBy, sortOrder, setFilteredResults]);

  useEffect(() => {
    filterAndSortResults();
  }, [filterAndSortResults]);

  return (
    <div>
      <Header title="Candidate Search" />



      <div className="px-2 sm:px-4 w-full mx-auto flex flex-col lg:flex-row gap-4 pt-20">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {showSidebar && (
          <div className="w-full lg:w-80 flex-shrink-0">
            <JobDescriptionSidebar />
          </div>
        )}

        <div className="flex-1 w-full">
          {compareState ? (
            <ComparePage />
          ) : (
            <>
              <MatchingUsersCard />
              {selectedJd && filteredResults.length > 0 && <MatchingSummaryCard />}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
