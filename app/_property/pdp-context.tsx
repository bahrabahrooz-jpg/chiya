"use client";

import { createContext, useContext } from "react";
import type { PdpData } from "./data";

const PdpCtx = createContext<PdpData | null>(null);

/** Provides the per-id property data to every PDP sub-component so the detail
    page renders the listing identified by the /property/[id] route. */
export function PdpProvider({ value, children }: { value: PdpData; children: React.ReactNode }) {
  return <PdpCtx.Provider value={value}>{children}</PdpCtx.Provider>;
}

export function usePdp(): PdpData {
  const v = useContext(PdpCtx);
  if (!v) throw new Error("usePdp must be used within a PdpProvider");
  return v;
}
