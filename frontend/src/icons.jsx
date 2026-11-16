import React from "react";

// Small, consistent outline icons. Decorative icons stay out of the accessibility tree.
const paths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.8" />
    </>
  ),
  cow: (
    <>
      <path d="M6 8 3 5v5l3 2m12-4 3-3v5l-3 2M8 7 6 3m10 4 2-4" />
      <path d="M6 8c0-2 12-2 12 0v8c0 6-12 6-12 0Z" />
      <rect x="7" y="14" width="10" height="6" rx="3" />
      <path d="M9 10v1m6-1v1m-5 6h.01M14 17h.01" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3v7a5 5 0 0 0 10 0V3M3 3h4m6 0h4m-7 12v2a5 5 0 0 0 10 0v-4" />
      <circle cx="20" cy="10" r="3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4M8 3v4M3 11h18m-13 5h2m4 0h2" />
    </>
  ),
  milk: (
    <>
      <path d="M9 3h6v4l3 4v10H6V11l3-4ZM9 7h6M6 12h12" />
      <path d="M12 14c-3 3-3 5 0 5s3-2 0-5Z" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  leaf: (
    <>
      <path d="M20 3C7 2 1 10 6 17s16 0 14-14Z" />
      <path d="M4 21 15 9" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  check: <path d="m5 12 4 4L19 6" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  box: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V8M12 13v10M7.5 5.5l9 5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 3v17h17M8 15l4-5 4 2 5-7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8m2 4a6 6 0 0 1 3 5" />
    </>
  ),
  heart: <path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-6 6 8 15 8 15S26 11 20 5Z" />,
  logout: (
    <>
      <path d="M9 4H4v16h5m6-12 5 4-5 4M9 12h11" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
    </>
  ),
};
export function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.leaf}
    </svg>
  );
}
