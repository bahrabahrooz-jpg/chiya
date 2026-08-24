"use client";

import { useEffect, useRef, useState } from "react";

/* ----------------------------------------------------------------------------
   Shared auto-save draft hook for the admin editor screens (Content, Settings).
   Neither screen has a manual Save/Cancel bar any more — every change persists
   on its own — so there is no dirty state to track or discard.
   ------------------------------------------------------------------------- */

/** Keeps a local editing `draft` for smooth typing and pushes it to the store
    shortly after edits stop, so a burst of keystrokes is one save.

    `initial` seeds the draft once (each section remounts when the nav switches,
    so it re-seeds naturally). `persist` fires debounced, only after the draft
    diverges from what was first loaded. */
export function useAutoSave<T>(initial: T, persist: (next: T) => void): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [draft, setDraft] = useState<T>(initial);
  const persistRef = useRef(persist);
  const baselineRef = useRef<string>(JSON.stringify(initial));

  useEffect(() => {
    persistRef.current = persist;
  });

  useEffect(() => {
    const serialized = JSON.stringify(draft);
    if (serialized === baselineRef.current) return;
    const id = setTimeout(() => {
      baselineRef.current = serialized;
      persistRef.current(draft);
    }, 600);
    return () => clearTimeout(id);
  }, [draft]);

  return [draft, setDraft];
}
