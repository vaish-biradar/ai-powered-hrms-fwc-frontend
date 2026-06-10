import { atom } from 'jotai';
import { JobOpening, MatchedJob } from '@/types/careers-types';

// Shared states
export const resumeUploadedAtom = atom(false);
export const processingResumeAtom = atom(false);
export const fileNameAtom = atom("");
export const matchingJobsAtom = atom<MatchedJob[]>([]);
export const jobOpeningsAtom = atom<JobOpening[]>([]);
export const loadingJdIdAtom = atom<string | null>(null);
export const resumeIDAtom = atom<string | null>(null);
export const applyingStatesAtom = atom<Record<string, boolean>>({});
export const isAnalysisLoadingAtom = atom<Record<string, boolean>>({});

export const jobIdAtom = atom<string | null>(null);
export const similarityAtom = atom<number | null>(null);
export const jdTitleAtom = atom<string | null>(null);