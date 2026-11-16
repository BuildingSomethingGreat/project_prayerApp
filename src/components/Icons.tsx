import type { SVGProps } from "react";

function Icon({ size = 24, children, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

type P = { size?: number };

export const Play = ({ size = 28 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8.2 5.3c0-1 1.1-1.6 2-1.1l9.6 5.7c.9.5.9 1.7 0 2.2l-9.6 5.7c-.9.5-2-.1-2-1.1V5.3Z" transform="translate(-1.6 1)" />
  </svg>
);

export const Pause = ({ size = 28 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="6" y="5" width="4.2" height="14" rx="1.6" />
    <rect x="13.8" y="5" width="4.2" height="14" rx="1.6" />
  </svg>
);

export const Prev = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="4.5" y="6" width="2.4" height="12" rx="1.2" />
    <path d="M19.5 7.2v9.6c0 .8-.9 1.3-1.6.8l-7.3-4.8a1 1 0 0 1 0-1.6l7.3-4.8c.7-.5 1.6 0 1.6.8Z" />
  </svg>
);

export const Next = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="17.1" y="6" width="2.4" height="12" rx="1.2" />
    <path d="M4.5 7.2v9.6c0 .8.9 1.3 1.6.8l7.3-4.8a1 1 0 0 0 0-1.6L6.1 6.4c-.7-.5-1.6 0-1.6.8Z" />
  </svg>
);

export const ChevronDown = (p: P) => (
  <Icon {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Icon>
);

export const ChevronLeft = (p: P) => (
  <Icon {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Icon>
);

export const Plus = (p: P) => (
  <Icon {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Icon>
);

export const Check = ({ size = 14 }: P) => (
  <Icon size={size} strokeWidth={2.4}>
    <path d="m5.5 12.5 4.2 4 8.8-9" />
  </Icon>
);

export const Book = (p: P) => (
  <Icon {...p}>
    <path d="M12 6.8c-1.6-1.2-3.8-1.8-7-1.8v12.2c3.2 0 5.4.6 7 1.8 1.6-1.2 3.8-1.8 7-1.8V5c-3.2 0-5.4.6-7 1.8Z" />
    <path d="M12 6.8V19" />
  </Icon>
);

/** Background music. */
export const Waves = (p: P) => (
  <Icon {...p}>
    <path d="M4 14c2.2 0 2.2-4 4.4-4s2.200 4 4.400 4 2.200-4 4.400-4S19.400 14 20 14" />
    <path d="M4 18.500c2.200 0 2.200-2 4.400-2s2.200 2 4.400 2 2.200-2 4.400-2 2.200 2 2.800 2" opacity=".55" />
    <path d="M4 7.500c2.200 0 2.200-2 4.400-2s2.200 2 4.400 2 2.200-2 4.400-2 2.200 2 2.800 2" opacity=".55" />
  </Icon>
);
