import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'UwezoFundPortal/1.0 (loans-staging.uwezo.go.ke)';

export interface GeocodeResult {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const county = searchParams.get('county')?.trim();
  const constituency = searchParams.get('constituency')?.trim();
  const ward = searchParams.get('ward')?.trim();

  const searchQuery = [query, ward, constituency, county, 'Kenya']
    .filter(Boolean)
    .join(', ');

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '6');
    url.searchParams.set('countrycodes', 'ke');
    url.searchParams.set('q', searchQuery);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding service unavailable', results: [] },
        { status: 502 },
      );
    }

    const data = (await response.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    const results: GeocodeResult[] = data.map((item) => ({
      placeId: String(item.place_id),
      label: item.display_name,
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[api/geocode] Failed to geocode landmark:', error);
    return NextResponse.json(
      { error: 'Failed to search locations', results: [] },
      { status: 500 },
    );
  }
}
