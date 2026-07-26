"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className={`fixed left-0 top-0 z-[100] h-[2px] bg-tertiary-fixed-dim transition-all ease-out ${
        loading ? "w-full duration-300 opacity-100" : "w-0 duration-0 opacity-0"
      }`}
    />
  );
}
