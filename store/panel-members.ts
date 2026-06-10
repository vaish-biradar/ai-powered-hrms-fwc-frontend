// atoms/membersAtom.ts
import { atom } from "jotai";
import { PanelMember } from "@/types/dashboard";

export const membersAtom = atom<PanelMember[]>([]);
