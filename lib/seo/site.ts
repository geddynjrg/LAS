import type { Metadata } from 'next';

export const LOANS_SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://loans.uwezo.go.ke';

export const LOANS_SITE_NAME = 'Uwezo Loan Application';
export const LOANS_SITE_TAGLINE = 'Apply for Uwezo Fund Loans Online';

export const LOANS_DEFAULT_DESCRIPTION =
  'Apply for Uwezo Fund loans online. Access affordable financing for youth, women, and persons with disabilities through Kenya\'s Uwezo Fund loan application portal.';

export const LOANS_KEYWORDS = [
  'Uwezo Fund',
  'Uwezo loan application',
  'Kenya youth loan',
  'women group loan Kenya',
  'PWD loan Kenya',
  'affordable financing Kenya',
  'uwezo.go.ke',
  'loans.uwezo.go.ke',
  'group loan application',
  'microfinance Kenya',
];

export const LOANS_OG_IMAGE = '/uwezo_logo_full.png';

export const LOANS_PUBLIC_PATHS = ['/'] as const;

const noIndexRobots: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function createLoansMetadata({
  title,
  description = LOANS_DEFAULT_DESCRIPTION,
  path = '/',
  keywords = LOANS_KEYWORDS,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
} = {}): Metadata {
  const canonicalUrl = new URL(path, LOANS_SITE_URL).toString();
  const pageTitle = title
    ? `${title} | ${LOANS_SITE_NAME}`
    : `${LOANS_SITE_NAME} — ${LOANS_SITE_TAGLINE}`;

  return {
    metadataBase: new URL(LOANS_SITE_URL),
    title: pageTitle,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    robots: noIndex ? noIndexRobots : { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_KE',
      url: canonicalUrl,
      siteName: LOANS_SITE_NAME,
      title: pageTitle,
      description,
      images: [
        {
          url: LOANS_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${LOANS_SITE_NAME} — Uwezo Fund`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [LOANS_OG_IMAGE],
    },
  };
}

export const LOANS_NOINDEX_METADATA = createLoansMetadata({ noIndex: true });
