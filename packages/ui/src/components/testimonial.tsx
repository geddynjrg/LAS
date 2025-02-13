import { IconQuote } from "@tabler/icons-react";
import type { FC } from "react";

export interface TestimonialProps {
  title: string;
  imageUrl: string;
  imageAlt?: string;
  children?: React.ReactNode;
}

export const Testimonial: FC<TestimonialProps> = ({
  title,
  imageUrl,
  imageAlt,
  children,
}) => {
  return (
    <article className="bg-theme-100 px-5.5 relative mt-10 flex w-auto max-w-[360px] flex-col items-center gap-4 rounded-2xl pb-9 pt-14">
      <img
        src={imageUrl}
        alt={imageAlt}
        className="bg-theme-100 absolute -top-9 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full"
      />
      <div className="gap-2.5 text-center">
        <h2 className="typo-h6">{title}</h2>
        {children}
      </div>
      <IconQuote className="text-primary absolute left-2 top-2" size={36} />
      <IconQuote
        className="text-primary absolute bottom-2 right-2 rotate-180"
        size={36}
      />
    </article>
  );
};
