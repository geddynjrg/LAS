import type { FC } from "react";

export interface IconCheckProps {
  className?: string;
}

export const IconCheck: FC<IconCheckProps> = ({ className }) => (
  <svg width={130} height={130} className={className} viewBox="0 0 130 130">
    <circle cx="65" cy="65" r="65" fill="#118c3f" />
    <polyline
      points="45.45 65.18 58.51 78.03 84.48 51.93"
      fill="none"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="12.5"
      className="animate-draw-checkmark"
    />
  </svg>
);
