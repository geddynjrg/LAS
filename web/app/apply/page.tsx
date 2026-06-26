import { getApplyExampleImages } from '@/lib/apply-example-images';
import { getApplicationInstructions } from '@/lib/api/application/instruction';
import type { DocumentRequirement } from '@/lib/api/schema/application/instruction.schema';
import { IconArrowLeft, IconPinEnd } from '@tabler/icons-react';
import { ActionBar } from '@workspace/ui/components/action-bar';
import { Button } from '@workspace/ui/components/button';
import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from '@workspace/ui/components/carousel';
import { Container } from '@workspace/ui/components/container';
import { Underline } from '@workspace/ui/components/underline';
import { ApplySideLogo } from '@workspace/ui/components/uwezo/apply-side-logo';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import type { FC, ReactNode } from 'react';

// Helper function to format image filename into a readable title
function formatImageTitle(filename: string): string {
  return (
    filename
      // Remove file extension
      .replace(/\.[^/.]+$/, '')
      // Replace hyphens and underscores with spaces
      .replace(/[-_]/g, ' ')
      // Capitalize first letter of each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export default async function Page() {
  const t = await getTranslations('ApplyPage');

  let data;
  try {
    const instructions = await getApplicationInstructions();
    data = instructions.data;
  } catch (error) {
    console.error('Failed to fetch application instructions:', error);
    // Fallback data to prevent hydration issues
    data = {
      title: 'Application Instructions',
      body: null,
      documents_required: [],
    };
  }

  return (
    <div className="relative mt-4 flex flex-1 flex-col">
      <Container className="mb-8">
        <div className="border-b-1 flex flex-col gap-4 border-neutral-400 pb-8">
          <Button
            asChild
            variant="secondary"
            className="self-start text-neutral-700 max-md:w-full"
          >
            <Link href={'/'}>
              <IconArrowLeft />
              {t('backToFrontPage')}
            </Link>
          </Button>
          <h1 className="typo-h2">{data.title}</h1>
          {data.body && (data.body.processed || data.body.value) && (
            <div
              className="typo-body-large"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: data.body.processed || data.body.value || '',
              }}
            />
          )}
        </div>
      </Container>

      <h1 className="typo-h3 mb-8 px-4 md:mx-auto">{t('documentsRequired')}</h1>

      <Container className="space-y-8 px-0 pb-8 md:max-w-[600px]">
        {data.documents_required.map((document, index) => (
          <DocumentRequirementSection
            key={document.title}
            document={document}
            index={index + 1}
          />
        ))}
      </Container>

      <ActionBar>
        <Button className="px-22 mx-auto" asChild>
          <Link href="/apply/create">{t('beginFillingForm')}</Link>
        </Button>
      </ActionBar>
    </div>
  );
}

const DocumentRequirementSection: FC<{
  document: DocumentRequirement;
  index: number;
}> = ({ document, index }) => {
  const exampleImages = getApplyExampleImages(document);
  const singleExample =
    exampleImages.length === 1 ? exampleImages[0] : undefined;

  return (
    <ApplyContentContainer>
      <SectionHeader index={index}>{document.title}</SectionHeader>

      {/* Description */}
      {document.subtitle &&
        (document.subtitle.processed || document.subtitle.value) && (
          <div className="mb-4 px-4">
            <div
              className="typo-body-medium [&_ul]:list-inside [&_ul]:list-disc [&_ul]:px-4 [&_ul]:py-4"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html:
                  document.subtitle.processed || document.subtitle.value || '',
              }}
            />
          </div>
        )}

      {/* Example Images */}
      {exampleImages.length > 0 && (
        <div className="flex flex-col items-center">
          {singleExample ? (
            <div className="flex flex-col items-center">
              <p className="typo-body-medium mb-3 font-bold">
                {formatImageTitle(singleExample.label)}
              </p>
              <Image
                src={singleExample.src}
                alt={singleExample.alt}
                width={300}
                height={200}
              />
            </div>
          ) : exampleImages.length > 1 ? (
            <Carousel>
              <CarouselContent>
                {exampleImages.map((example, exampleIndex) => (
                  <CarouselItem
                    key={`${example.src}-${exampleIndex}`}
                    className="flex flex-col items-center"
                  >
                    <p className="typo-body-medium mb-3 font-bold">
                      {formatImageTitle(example.label)}
                    </p>
                    <Image
                      src={example.src}
                      alt={example.alt}
                      width={300}
                      height={200}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselControls />
            </Carousel>
          ) : null}

          {/* Examples subtitle */}
          {document.examples_subtitle && (
            <p className="typo-body-medium px-4">
              {document.examples_subtitle}
            </p>
          )}

          {/* More info link */}
          {document.link && (
            <div className="mt-2 flex flex-row gap-1">
              <Link
                href={document.link.uri}
                className={'text-primary typo-link'}
              >
                <Underline
                  variant="primary"
                  className="text-primary items-center"
                >
                  {document.link.title}
                  <IconPinEnd className="scale-x-[-1]" />
                </Underline>
              </Link>
            </div>
          )}
        </div>
      )}
    </ApplyContentContainer>
  );
};

const SectionHeader: FC<{
  index: number;
  children: ReactNode;
}> = ({ index, children }) => {
  return (
    <div className="flex flex-row items-center gap-5">
      <div className="relative">
        <ApplySideLogo height={121} />
        <span className="typo-h1 text-primary-foreground absolute left-1/2 top-1/2 -translate-x-[calc(50%+5px)] -translate-y-1/2">
          {index}
        </span>
      </div>
      <h1 className="typo-h5">{children}</h1>
    </div>
  );
};

const ApplyContentContainer: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="md:bg-background md:rounded md:pb-8 md:pt-4">
      {children}
    </div>
  );
};
