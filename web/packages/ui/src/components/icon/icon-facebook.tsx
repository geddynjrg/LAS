import type { FC } from "react";

export interface IconFacebookProps {
  width?: number;
  height?: number;
  className?: string;
}

export const IconFacebook: FC<IconFacebookProps> = ({
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
      <g clipPath="url(#a)">
        <path
          fill="#0866FF"
          d="M32 16.667c0-8.836-7.163-16-16-16-8.836 0-16 7.164-16 16 0 7.503 5.166 13.8 12.135 15.529v-10.64h-3.3v-4.889h3.3V14.56c0-5.446 2.465-7.97 7.811-7.97 1.014 0 2.763.2 3.479.398v4.432c-.378-.04-1.034-.06-1.849-.06-2.623 0-3.637.994-3.637 3.578v1.729h5.226l-.898 4.89H17.94V32.55c7.923-.957 14.062-7.702 14.062-15.883H32Z"
        />
        <path
          fill="#fff"
          d="m22.267 21.557.898-4.89h-5.226v-1.73c0-2.583 1.013-3.577 3.637-3.577.814 0 1.47.02 1.848.06V6.988c-.715-.2-2.465-.398-3.478-.398-5.347 0-7.812 2.524-7.812 7.97v2.107H8.835v4.89h3.3v10.64a16.029 16.029 0 0 0 5.803.353V21.557h4.328Z"
        />
      </g>
      <defs>
        <clipPath id="a">
          <path fill="#fff" d="M0 .667h32v32H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};
