import { atom } from "jotai";
import { Resume } from "@/types/dashboard";

export const resumesAtom = atom<Resume[]>([]);
