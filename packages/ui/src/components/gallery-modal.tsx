"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from "@workspace/ui/components/modal";

interface GalleryModalContext {
  startIndex: number;
  setStartIndex: (index: number) => void;
}

const GalleryModalContext = createContext<GalleryModalContext | null>(null);

export interface GalleryModalImage {
  url: string;
  alt: string;
}

export interface GalleryModal extends PropsWithChildren {
  title: string;
  images: Array<GalleryModalImage | undefined>;
}

export const GalleryModal: FC<GalleryModal> = ({ images, title, children }) => {
  const [index, setIndex] = useState(0);

  // helper to set the start index
  const setStartIndex = useCallback((index: number) => {
    setIndex(index);
  }, []);

  const contextValue = useMemo<GalleryModalContext>(
    () => ({ startIndex: index, setStartIndex }),
    [index, setStartIndex],
  );

  return (
    <GalleryModalContext.Provider value={contextValue}>
      <Modal>
        {children}

        <ModalContent size="fluid" variant="transparent" className="max-h-dvh">
          <ModalTitle className="sr-only">{title}</ModalTitle>
          <Carousel
            className="h-full"
            opts={{ startIndex: contextValue.startIndex }}
          >
            <CarouselContent className="h-full">
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <ModalTrigger asChild>
                    <div className="h-full w-full">
                      <img
                        className="m-auto h-full object-contain"
                        src={image?.url}
                        alt={image?.alt}
                        onClick={(e) => {
                          // prevent closing the modal when clicking on the image
                          e.stopPropagation();
                        }}
                      />
                    </div>
                  </ModalTrigger>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselControls
              position="onContent"
              variant="white"
              className="mb-2"
            />
          </Carousel>
        </ModalContent>
      </Modal>
    </GalleryModalContext.Provider>
  );
};

export interface GalleryModalTriggerProps extends PropsWithChildren {
  index?: number;
  asChild?: boolean;
}

export const GalleryModalTrigger: FC<GalleryModalTriggerProps> = ({
  index,
  ...props
}) => {
  const { setStartIndex } = useGalleryModal();

  return (
    <ModalTrigger
      {...props}
      onClick={() => {
        setStartIndex(index ?? 0);
      }}
    />
  );
};

function useGalleryModal() {
  const context = useContext(GalleryModalContext);
  if (!context) {
    throw new Error(
      "useGalleryModal must be used within a GalleryModalProvider.",
    );
  }

  return context;
}
