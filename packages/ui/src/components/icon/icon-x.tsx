import type { FC } from "react";

export interface IconXProps {
  width?: number;
  height?: number;
  className?: string;
}

export const IconX: FC<IconXProps> = ({
  width = 32,
  height = 33,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 33"
      width={width}
      height={height}
      {...props}
    >
      <path
        fill="#000"
        d="M24.435 3.206h4.498l-9.827 11.23 11.56 15.284h-9.051l-7.09-9.269-8.112 9.27h-4.5l10.51-12.014L1.333 3.206h9.282l6.408 8.472zm-1.578 23.822h2.492L9.26 5.756H6.586z"
      ></path>
    </svg>
  );
};
