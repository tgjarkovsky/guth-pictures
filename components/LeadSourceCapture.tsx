"use client";

import { useEffect } from "react";
import { captureLeadSource } from "@/lib/lead-source";

/** Records where the visitor came from on the first page they open. Renders nothing. */
export function LeadSourceCapture() {
  useEffect(captureLeadSource, []);
  return null;
}
