import type { FC } from "react";
import ReactCountup, { CountUpProps as ReactCountUpProps } from "react-countup";

export type CountupProps = ReactCountUpProps;

export const Countup: FC<ReactCountUpProps> = ReactCountup;
