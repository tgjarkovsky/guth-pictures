"use client";

import { useEffect } from "react";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EditorialSubpage active={null} className="ed-center">
      <h1>Něco se pokazilo</h1>
      <p>
        Omlouváme se, nastala neočekávaná chyba. Zkuste stránku načíst znovu.
      </p>
      <button
        onClick={reset}
        className="ed-cta"
      >
        Zkusit znovu
      </button>
    </EditorialSubpage>
  );
}
