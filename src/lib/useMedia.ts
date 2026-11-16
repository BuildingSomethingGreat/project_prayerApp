import { useEffect, useState } from "react";

/** True while the media query matches. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** The breakpoint at which screens move from one column to a desktop layout. Keep in step with app.css. */
export const WIDE = "(min-width: 1000px)";
