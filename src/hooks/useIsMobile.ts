import { useEffect, useState } from "react";

/** Returns true when the viewport is narrower than `breakpoint` (default 768px = md) */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [breakpoint]);

  return isMobile;
}

/** Returns true when the viewport is narrower than 1024px = lg (tablet range) */
export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    setIsTablet(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  return isTablet;
}
