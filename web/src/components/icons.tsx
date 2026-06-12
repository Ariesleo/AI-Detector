import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svgProps({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const ImageIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M3.5 17.5 9 13l4 3.5 3.5-3 4 4" />
  </svg>
);

export const WaveIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3 12h.5M6.5 8.5v7M10 5.5v13M13.5 8v8M17 6.5v11M20.5 10.5v3" />
  </svg>
);

export const VideoIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="5.5" width="13" height="13" rx="2.5" />
    <path d="m16 10 5-3v10l-5-3" />
  </svg>
);

export const DocIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M6 3.5h8L19 8.5v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20.5v-15A1.5 1.5 0 0 1 6.5 3.5Z" />
    <path d="M14 3.5V9h5M8.5 13h7M8.5 16.5h5" />
  </svg>
);

export const UploadIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 16V4m0 0 -4.5 4.5M12 4l4.5 4.5" />
    <path d="M4 16.5v2A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-2" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const AlertIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 3.5 22 20H2L12 3.5Z" />
    <path d="M12 10v4.5M12 17.5v.01" />
  </svg>
);

export const CameraIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 8h2.5L9 5h6l2.5 3H20a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 8Z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
);

export const MenuIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
