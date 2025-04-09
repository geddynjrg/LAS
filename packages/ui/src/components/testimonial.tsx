import { IconQuote, IconUserFilled } from "@tabler/icons-react";
import Image from "next/image";
import type { FC } from "react";

export interface TestimonialProps {
  title?: string;
  imageUrl?: string;
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
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={imageAlt ?? "Person's image"}
          className="bg-theme-100 absolute -top-9 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full object-cover"
          width={80}
          height={80}
        />
      )}
      {!imageUrl && (
        <div className="bg-primary absolute -top-9 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center rounded-full">
          <IconUserFilled className="mx-auto h-16 w-16 text-neutral-100" />
        </div>
      )}
      <div className="z-2 gap-2.5 text-center">
        {title && <h2 className="typo-h6">{title}</h2>}
        {children}
      </div>
      <IconQuote className="text-primary absolute left-0 top-0" size={58} />
      <IconQuote
        className="text-primary absolute bottom-0 right-0 rotate-180"
        size={58}
      />
    </article>
  );
};
