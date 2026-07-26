"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface TailoringConfig {
  measurements: Record<string, string>;
  neckline: string;
  necklinePrice: number;
  sleeve: string;
  sleevePrice: number;
  hemline: string;
  hemlinePrice: number;
  garmentType: string;
  basePrice: number;
  stitcherSlug: string;
}

export const MEASUREMENT_FIELDS = [
  "Chest",
  "Waist",
  "Hips",
  "Shoulder",
  "Arm Length",
  "Length",
  "Bicep",
  "Neck",
  "Front Length",
  "Back Length",
  "Trouser Length",
  "Inseam",
] as const;

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
  stitcherSlug: "khyber-artisans",
};

function hasMeasurements(config: TailoringConfig) {
  return Object.values(config.measurements).some((v) => v?.trim());
}

interface TailoringContextValue {
  config: TailoringConfig;
  setConfig: (c: TailoringConfig) => void;
  total: number;
  mounted: boolean;
}

const TailoringContext = createContext<TailoringContextValue | null>(null);
const STORAGE_KEY = "fujrs-tailoring-config";

async function syncConfigToServer(config: TailoringConfig) {
  try {
    await fetch("/api/tailoring-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  } catch {
    // Optimistic local state already applied.
  }
}

export function TailoringProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [config, setConfigState] = useState<TailoringConfig>(defaultConfig);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      (async () => {
        let localConfig: TailoringConfig | null = null;
        try {
          localConfig = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        } catch {
          localConfig = null;
        }

        try {
          const res = await fetch("/api/tailoring-config");
          const data = await res.json();
          const dbConfig: TailoringConfig | null = res.ok ? data.config : null;

          if (dbConfig) {
            // A saved account config takes priority — it's the
            // deliberately-saved cross-device one.
            setConfigState(dbConfig);
          } else if (localConfig && hasMeasurements(localConfig)) {
            setConfigState(localConfig);
            await syncConfigToServer(localConfig);
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          if (localConfig) setConfigState(localConfig);
        }
        setMounted(true);
      })();
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        if (stored) setConfigState(stored);
      } catch {
        /* ignore */
      }
      setMounted(true);
    }
  }, [status]);

  function setConfig(c: TailoringConfig) {
    setConfigState(c);
    if (status === "authenticated") {
      syncConfigToServer(c);
    } else if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    }
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
