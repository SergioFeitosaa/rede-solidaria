import type { SVGProps } from "react";

/**
 * Ícones em SVG inline (stroke), sem dependência externa.
 * Tamanho padrão 20px, cor herdada de `currentColor`.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </Svg>
);

export const IconHandHeart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 8.6c1-1.6 3.4-1.8 4.4-.2 1 1.7-.2 3.4-4.4 6.1-4.2-2.7-5.4-4.4-4.4-6.1 1-1.6 3.4-1.4 4.4.2Z" />
    <path d="M4 16.5v4.2M4 16.5c1.6-.7 3.2-.6 4.6.3l2.2 1.4c.9.6 2 .4 2.6-.4" />
    <path d="M20 16.5v4.2M20 16.5c-1.6-.7-3.2-.6-4.6.3" />
  </Svg>
);

export const IconHeart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7.5-4.6-7.5-9a4.2 4.2 0 0 1 7.5-2.6A4.2 4.2 0 0 1 19.5 11c0 4.4-7.5 9-7.5 9Z" />
  </Svg>
);

export const IconSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
    <path d="M18.5 16.5 19.3 19l2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8.8-2.5Z" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 12h15" />
    <path d="m13.5 6 6 6-6 6" />
  </Svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19.5 12h-15" />
    <path d="m10.5 6-6 6 6 6" />
  </Svg>
);

export const IconUndo = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 7 4.5 11.5 9 16" />
    <path d="M4.5 11.5h9a6 6 0 0 1 0 12" />
  </Svg>
);

export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
);

export const IconBox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2V8.2Z" />
    <path d="M3.5 8.2 12 12.4l8.5-4.2M12 12.4V20" />
  </Svg>
);

export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.2 5 6v5.4c0 4.3 2.9 7.4 7 9.4 4.1-2 7-5.1 7-9.4V6l-7-2.8Z" />
    <path d="m9 11.7 2.2 2.2L15.4 9.6" />
  </Svg>
);

export const IconChart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8.5 16.5V11M13 16.5V7.5M17.5 16.5v-3" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconList = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </Svg>
);

export const IconCards = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="7.5" width="10" height="13" rx="2.2" />
    <path d="M7.5 4.5h9.2a2.3 2.3 0 0 1 2.3 2.3v9.7" />
  </Svg>
);

export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.4" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
);

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7.5" />
    <path d="M18 12H10m8 0-3-3m3 3-3 3" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.5 21 19H3L12 4.5Z" />
    <path d="M12 10v4.2M12 16.8v.2" />
  </Svg>
);

export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8.2v.2" />
  </Svg>
);

export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16 5.6a3.2 3.2 0 0 1 0 6M17.5 15.4c2 .6 3.5 2.3 3.5 4.6" />
  </Svg>
);

export const IconLeaf = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 4c-9 0-14 4.2-14 10a5.5 5.5 0 0 0 5.5 5.5C17.5 19.5 20 13 20 4Z" />
    <path d="M4 20c1.5-5 5-8.5 10-10.5" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.2" />
    <path d="M15.5 5.5h-9a2 2 0 0 0-2 2v9" />
  </Svg>
);

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconLogo = ({ size = 32, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
    <rect width="32" height="32" rx="9" fill="currentColor" />
    <path
      d="M16 24.2s-6.6-3.9-6.6-8.1a3.7 3.7 0 0 1 6.6-2.3 3.7 3.7 0 0 1 6.6 2.3c0 4.2-6.6 8.1-6.6 8.1Z"
      stroke="white"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path d="M10 12.2c1.6-2.6 4.2-3.6 6-3.6s4.4 1 6 3.6" stroke="white" strokeWidth="1.9" strokeLinecap="round" opacity=".7" />
  </svg>
);
