"use client";

import { useEffect } from "react";
import { captureUtmParams } from "@/lib/tracking";

export function TrackingScripts() {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return null;
}
