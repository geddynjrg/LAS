/**
 * A mock component for the next/link outside of NextJS project.
 */

export declare const ImageProps: Omit<
  React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >,
  "height" | "width" | "loading" | "ref" | "alt" | "src" | "srcSet"
> & {
  src: string;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  loader?: unknown;
  quality?: number | `${number}`;
  priority?: boolean;
  loading?: "eager" | "lazy" | undefined;
  placeholder?: "blur" | "empty" | `data:image/${string}`;
  blurDataURL?: string;
  unoptimized?: boolean;
  overrideSrc?: string;
  onLoadingComplete?: (img: HTMLImageElement) => void;
  layout?: string;
  objectFit?: string;
  objectPosition?: string;
  lazyBoundary?: string;
  lazyRoot?: string;
} & React.RefAttributes<HTMLImageElement | null>;

export default function Image(props: typeof ImageProps) {
  const { fill, ...imgProps } = props;
  return (
    <img
      {...imgProps}
      style={fill ? { width: "100%", height: "100%" } : undefined}
    />
  );
}
