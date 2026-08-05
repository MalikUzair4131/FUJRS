"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { tailoring } from "@/lib/data";
import type { TailoringConfig } from "@/lib/data";
import { DEFAULT_STITCHER_SLUG } from "@/data/stitchers";

// Re-exported so existing importers keep working; the shape lives in the data
// layer, where it maps onto a `stitching_requests` row.
export type { TailoringConfig };

export const NECKLINES = [
  { label: "Boat Neck", icon: "horizontal_rule", price: 0 },
  { label: "Mandarin", icon: "change_history", price: 0 },
  { label: "Deep V", icon: "keyboard_arrow_down", price: 1500 },
];

export const SLEEVES = [
  { label: "Full Length", price: 0 },
  { label: "Bell Cuff", price: 2000 },
  { label: "Quarter", price: 0 },
];

export const HEMLINES = [
  { label: "Straight Classic", icon: "remove", price: 0 },
  { label: "Scalloped Edge", icon: "auto_awesome", price: 2500 },
];

export const GARMENT_PRICES: Record<string, number> = {
  "2-Piece Suit (Kurta & Trousers)": 12500,
  "3-Piece Luxury Suit": 16500,
  "Formal Saree Blouse": 22000,
  "Bridal Wear / Pishwas": 42000,
};

const defaultConfig: TailoringConfig = {
  measurements: {},
  neckline: NECKLINES[1].label,
  necklinePrice: NECKLINES[1].price,
  sleeve: SLEEVES[0].label,
  sleevePrice: SLEEVES[0].price,
  hemline: HEMLINES[0].label,
  hemlinePrice: HEMLINES[0].price,
  garmentType: "3-Piece Luxury Suit",
  basePrice: GARMENT_PRICES["3-Piece Luxury Suit"],
  stitcherSlug: DEFAULT_STITCHER_SLUG,
};

interface TailoringContextValue {
  config: TailoringConfig;
  setConfig: (c: TailoringConfig) => void;
  total: number;
  mounted: boolean;
}

const TailoringContext = createContext<TailoringContextValue | null>(null);

export function TailoringProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<TailoringConfig>(defaultConfig);
  const [mounted, setMounted] = useState(false);

  // Storage lives in the data layer; this provider holds React state only.
  useEffect(() => {
    let active = true;
    tailoring
      .read()
      .then((stored) => {
        if (active && stored) setConfigState(stored);
      })
      .finally(() => {
        if (active) setMounted(true);
      });
    return () => {
      active = false;
    };
  }, []);

  function setConfig(c: TailoringConfig) {
    setConfigState(c);
    void tailoring.write(c);
  }

  const total = config.basePrice + config.necklinePrice + config.sleevePrice + config.hemlinePrice;

  return (
    <TailoringContext.Provider value={{ config, setConfig, total, mounted }}>
      {children}
    </TailoringContext.Provider>
  );
}

export function useTailoring() {
  const ctx = useContext(TailoringContext);
  if (!ctx) throw new Error("useTailoring must be used within TailoringProvider");
  return ctx;
}
