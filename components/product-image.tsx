"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { themedProductImageSrc } from "@/lib/utils/product-image";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Theme-aware product image. Swaps the shared placeholder's colors for a
 * dark-mode-friendly pair once mounted, avoiding a hydration mismatch (same
 * mount-guard pattern as the nav bar's theme-aware logo).
 */
export function ProductImage({ src, alt, className }: ProductImageProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag, same pattern as ThemeToggle
  useEffect(() => setMounted(true), []);

  const resolvedSrc = themedProductImageSrc(src, mounted && resolvedTheme === "dark");

  // eslint-disable-next-line @next/next/no-img-element -- product photos are external/placeholder URLs
  return <img src={resolvedSrc} alt={alt} className={className} />;
}
