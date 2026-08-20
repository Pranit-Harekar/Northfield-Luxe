"use client";

import { useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { AD_CLIENT, HERO_AD_SLOT } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** A single AdSense display ad slot. Pushes itself to `adsbygoogle` once
 * mounted, so each slide in the carousel gets its own independent ad
 * request. */
function AdUnit({ slot }: { slot: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script may not be loaded yet (e.g. ad blockers) — fail
      // silently, the <ins> slot simply stays empty.
    }
  }, []);

  return (
    <ins
      className="adsbygoogle block h-full w-full"
      style={{ display: "block" }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

// Each slide should ideally use its own ad-unit slot id from the AdSense
// dashboard; these all reuse the same placeholder until real slot ids are
// created for this placement (see lib/ads.ts).
const SLIDES = [HERO_AD_SLOT, HERO_AD_SLOT, HERO_AD_SLOT];

/** Hero-style ad carousel shown only at the top of the shop page. Not
 * imported anywhere else, so ad slots never render on any other page. */
export function HeroAdCarousel() {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    const id = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 6000);
    return () => clearInterval(id);
  }, [api]);

  // No publisher id / ad-unit slot configured (env vars unset) — skip
  // rendering the carousel entirely rather than showing empty ad boxes.
  if (!AD_CLIENT || !HERO_AD_SLOT) return null;

  return (
    <div className="mb-6 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Advertisement</p>
      <Carousel setApi={setApi} opts={{ loop: true }} className="overflow-hidden rounded-lg border border-border bg-muted/30">
        <CarouselContent>
          {SLIDES.map((slot, index) => (
            <CarouselItem key={index}>
              <div className="flex h-32 w-full items-center justify-center sm:h-40">
                <AdUnit slot={slot} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
}
