import {
  LOANS_DEFAULT_DESCRIPTION,
  LOANS_SITE_NAME,
  LOANS_SITE_URL,
} from '@/lib/seo/site';

export function LoansJsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOrganization',
    name: 'Uwezo Fund',
    url: 'https://www.uwezo.go.ke',
    logo: `${LOANS_SITE_URL}/uwezo_logo_full.png`,
    sameAs: ['https://www.facebook.com/TheUwezoFund'],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: LOANS_SITE_NAME,
    url: LOANS_SITE_URL,
    description: LOANS_DEFAULT_DESCRIPTION,
    publisher: {
      '@type': 'GovernmentOrganization',
      name: 'Uwezo Fund',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
