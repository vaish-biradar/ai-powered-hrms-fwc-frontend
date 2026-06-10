// atoms/applicationAtom.ts
import { atom } from "jotai";
import axios from "axios";
import { Application } from "@/types/dashboard";

// Base atoms
export const applicationsAtom = atom<Application[]>([]);
export const loadingAtom = atom<boolean>(true);

// Fetch applications atom (read/write)
export const fetchApplicationsAtom = atom(
  (get) => get(applicationsAtom),
  async (_get, set) => {
    set(loadingAtom, true);
    try {
      const response = await axios.get("/api/applications");
      set(applicationsAtom, response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Filter atoms
export const searchTermAtom = atom<string>("");
export const statusFilterAtom = atom<string>("all");
export const jobTitleFilterAtom = atom<string>("all");

// Derived atom for filtered applications
export const filteredApplicationsAtom = atom((get) => {
  const applications = get(applicationsAtom);
  const searchTerm = get(searchTermAtom).toLowerCase();
  const statusFilter = get(statusFilterAtom);
  const jobTitleFilter = get(jobTitleFilterAtom);

  return applications.filter((app) => {
    const matchesSearch =
      app.candidate_name.toLowerCase().includes(searchTerm) ||
      app.candidate_email.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      app.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesJobTitle =
      jobTitleFilter === "all" || app.job_title === jobTitleFilter;

    return matchesSearch && matchesStatus && matchesJobTitle;
  });
});

// UI state atom
export const activeApplicationTabAtom = atom<string>("all");
