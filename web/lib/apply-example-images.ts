import type { DocumentRequirement } from '@/lib/api/schema/application/instruction.schema';

/** Static example images served from /public/images (see repo public/images). */
const APPLY_EXAMPLE_IMAGE_BY_FILENAME: Record<string, string> = {
  group_registration_certificate: '/images/sample-certificate.png',
  group_credit_history: '/images/cert-example.jpg',
  list_of_members_certificate: '/images/id-example.jpg',
};

const APPLY_EXAMPLE_IMAGE_BY_TITLE: Record<string, string> = {
  'Valid group registration certificate': '/images/sample-certificate.png',
  'Group credit history': '/images/cert-example.jpg',
  "Group members' national IDs": '/images/id-example.jpg',
  'Group members’ national IDs': '/images/id-example.jpg',
};

function filenameStem(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '').toLowerCase();
}

export function resolveApplyExampleImageSrc(
  document: DocumentRequirement,
  exampleFilename?: string,
): string | undefined {
  const byTitle = APPLY_EXAMPLE_IMAGE_BY_TITLE[document.title];
  if (byTitle) {
    return byTitle;
  }

  if (exampleFilename) {
    const stem = filenameStem(exampleFilename);
    if (APPLY_EXAMPLE_IMAGE_BY_FILENAME[stem]) {
      return APPLY_EXAMPLE_IMAGE_BY_FILENAME[stem];
    }
  }

  return undefined;
}

export function getApplyExampleImages(document: DocumentRequirement) {
  const apiImages = document.example_images?.filter(Boolean) ?? [];

  if (apiImages.length === 0) {
    const fallback = resolveApplyExampleImageSrc(document);
    if (!fallback) {
      return [];
    }

    return [
      {
        src: fallback,
        alt: document.title,
        label: document.title,
      },
    ];
  }

  return apiImages.map((example) => {
    const localSrc =
      resolveApplyExampleImageSrc(document, example.filename) ?? example.url;

    return {
      src: localSrc,
      alt: example.filename,
      label: example.filename,
    };
  });
}
