// store/jd-store.ts
import { atom } from 'jotai';
import { JobDescription,MatchResult } from '@/types/dashboard';



export const jobDescriptionsAtom = atom<JobDescription[]>([]);
export const selectedJdAtom = atom<string | null>(null);
export const applyFilterAtom = atom<boolean>(false);
export const matchResultsAtom = atom<MatchResult[]>([]);
export const bookmarkedCandidatesAtom = atom<Set<string>>(new Set<string>()); 
export const filteredResultsAtom = atom<MatchResult[]>([]);
export const sidebarAtom = atom<boolean>(true);


export const loadingAtom = atom<boolean>(false);
export const matchLoadingAtom = atom<boolean>(false);
export const analysisLoadingAtom = atom<{ [key: string]: boolean }>({});
export const contactLoadingAtom = atom<{ [key: string]: boolean }>({});

export const errorAtom = atom<string | null >(null);
export const searchQueryAtom = atom<string>("");
export const sortByAtom = atom<string>("similarity");
export const sortOrderAtom = atom<"asc" | "desc">("desc");

export const selectedJobDescriptionAtom = atom((get) => {
    const jobDescriptions = get(jobDescriptionsAtom);
    const selectedJd = get(selectedJdAtom);
    return jobDescriptions.find((jd) => jd.id === selectedJd) || null;
});

export const compareStateAtom = atom(false);