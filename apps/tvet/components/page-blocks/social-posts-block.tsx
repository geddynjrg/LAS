import type { FC } from "react";

export interface SocialBlockProps {}

export const SocialPostsBlock: FC<SocialBlockProps> = ({}) => {
  return null;
  //   return (
  //     <section className="bg-neutral-100 py-12">
  //       <Container>
  //         <Heading type="h2">Our social media</Heading>
  //         <div className="mt-4 flex flex-row items-center justify-between gap-4">
  //           <div className="flex w-full gap-4 border-r border-[#D6DAE4]">
  //             <img
  //               src="/waithaka-logo.png"
  //               alt="Waithaka logo"
  //               width={50}
  //               height={50}
  //             />
  //             <div className="flex flex-col justify-center gap-1">
  //               <div className="typo-body-large font-bold">Waithaka VTC</div>
  //               <div className="text-[#9CA0AC]">{}</div>
  //             </div>
  //           </div>
  //           <Button className="ml-4">Follow us</Button>
  //         </div>
  //           <Carousel autoPlay={5000} className="mt-4">
  //             <CarouselContent>
  //               {social_links.map((post, i) => (
  //                 <CarouselItem
  //                   key={i}
  //                   className="lg:basis-2/7 aspect-square basis-2/3 px-1 sm:basis-2/5"
  //                 >
  //                   <SocialMediaCard
  //                     imageUrl={String(post.imageUrl)}
  //                     source={post?.source ?? "facebook"}
  //                   />
  //                 </CarouselItem>
  //               ))}
  //             </CarouselContent>
  //             <CarouselControls />
  //           </Carousel>
  //       </Container>
  //     </section>
  //   );
};
