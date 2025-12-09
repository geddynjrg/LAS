import type { FC } from "react";

export interface LogoProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const ApplySideLogo: FC<LogoProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 61 115.94"
    fill="none"
    {...props}
  >
    <path
      xmlns="http://www.w3.org/2000/svg"
      d="M49.13,93.27c7.44-9.77,11.87-22,11.87-35.27C61,25.97,35.26,0,3.5,0c-.99,0-1.97.03-2.94.08-.18,0-.37,0-.56-.02v115.87c30.6-1.32,55-26.75,55-57.94,0-5.35-.73-10.53-2.08-15.46,2.62,6.64,4.08,13.87,4.08,21.46,0,10.68-2.87,20.68-7.87,29.27Z"
      fill="#b7299f"
    />
  </svg>
);
