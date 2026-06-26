import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'UwezoFundPortal/1.0 (loans.uwezo.go.ke)';

export interface GeocodeBoundingBox {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface GeocodeResult {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
  boundingBox?: GeocodeBoundingBox;
}

type CacheEntry = {
  expires: number;
  results: GeocodeResult[];
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const responseCache = new Map<string, CacheEntry>();

function getCached(key: string): GeocodeResult[] | null {
  const entry = responseCache.get(key);
  if (!entry || entry.expires <= Date.now()) {
    responseCache.delete(key);
    return null;
  }

  return entry.results;
}

function setCached(key: string, results: GeocodeResult[]) {
  responseCache.set(key, {
    results,
    expires: Date.now() + CACHE_TTL_MS,
  });

  if (responseCache.size > 500) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }
}

function parseBoundingBox(
  boundingbox?: [string, string, string, string],
): GeocodeBoundingBox | undefined {
  if (!boundingbox || boundingbox.length !== 4) {
    return undefined;
  }

  const south = Number.parseFloat(boundingbox[0]);
  const north = Number.parseFloat(boundingbox[1]);
  const west = Number.parseFloat(boundingbox[2]);
  const east = Number.parseFloat(boundingbox[3]);

  if ([south, north, west, east].some((value) => Number.isNaN(value))) {
    return undefined;
  }

  return { south, north, west, east };
}

async function queryNominatim(
  searchQuery: string,
  limit: number,
): Promise<GeocodeResult[]> {
  const cacheKey = `${limit}:${searchQuery.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('countrycodes', 'ke');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('q', searchQuery);

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Geocoding service unavailable');
  }

  const data = (await response.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    boundingbox?: [string, string, string, string];
  }>;

  const results: GeocodeResult[] = data.map((item) => ({
    placeId: String(item.place_id),
    label: item.display_name,
    lat: Number.parseFloat(item.lat),
    lng: Number.parseFloat(item.lon),
    boundingBox: parseBoundingBox(item.boundingbox),
  }));

  setCached(cacheKey, results);
  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const county = searchParams.get('county')?.trim();
  const constituency = searchParams.get('constituency')?.trim();
  const ward = searchParams.get('ward')?.trim();
  const query = searchParams.get('q')?.trim();

  try {
    if (type === 'area') {
      const parts = [ward, constituency, county, 'Kenya'].filter(Boolean);

      if (parts.length < 2) {
        return NextResponse.json({ results: [] });
      }

      const results = await queryNominatim(parts.join(', '), 1);
      return NextResponse.json({ results });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchQuery = [query, ward, constituency, county, 'Kenya']
      .filter(Boolean)
      .join(', ');

    const results = await queryNominatim(searchQuery, 8);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[api/geocode] Failed to geocode:', error);
    return NextResponse.json(
      { error: 'Failed to search locations', results: [] },
      { status: 500 },
    );
  }
}
