import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const PHOTON_URL = 'https://photon.komoot.io/api/';
const USER_AGENT =
  'UwezoFundPortal/1.0 (loans.uwezo.go.ke; support@uwezo.go.ke)';

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
const MIN_PROVIDER_GAP_MS = 1100;
const FETCH_TIMEOUT_MS = 12_000;
const responseCache = new Map<string, CacheEntry>();

let providerChain: Promise<void> = Promise.resolve();
let lastProviderAt = 0;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withProviderThrottle<T>(fn: () => Promise<T>): Promise<T> {
  const run = providerChain.then(async () => {
    const wait = Math.max(
      0,
      MIN_PROVIDER_GAP_MS - (Date.now() - lastProviderAt),
    );
    if (wait > 0) {
      await sleep(wait);
    }

    try {
      return await fn();
    } finally {
      lastProviderAt = Date.now();
    }
  });

  providerChain = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

function parseBoundingBox(
  boundingbox?: [string, string, string, string] | number[],
): GeocodeBoundingBox | undefined {
  if (!boundingbox || boundingbox.length !== 4) {
    return undefined;
  }

  const south = Number.parseFloat(String(boundingbox[0]));
  const north = Number.parseFloat(String(boundingbox[1]));
  const west = Number.parseFloat(String(boundingbox[2]));
  const east = Number.parseFloat(String(boundingbox[3]));

  if ([south, north, west, east].some((value) => Number.isNaN(value))) {
    return undefined;
  }

  // Point / POI boxes are too tight for OSM embed tiles and look "blurred".
  const latSpan = Math.abs(north - south);
  const lngSpan = Math.abs(east - west);
  if (latSpan < 0.02 && lngSpan < 0.02) {
    return undefined;
  }

  return { south, north, west, east };
}

function buildLabel(parts: Array<string | undefined | null>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(', ');
}

function isKenyaResult(countryCode?: string, label?: string) {
  if (countryCode) {
    return countryCode.toLowerCase() === 'ke';
  }

  return (label || '').toLowerCase().includes('kenya');
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await withProviderThrottle(async () =>
        fetch(url, {
          ...init,
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
            ...(init?.headers || {}),
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        }),
      );

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`Upstream ${response.status}`);
        await sleep(attempt * 700);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Upstream ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(attempt * 700);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Geocoding service unavailable');
}

async function queryNominatim(
  searchQuery: string,
  limit: number,
): Promise<GeocodeResult[]> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('countrycodes', 'ke');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('q', searchQuery);

  const data = await fetchJson<
    Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
      class?: string;
      type?: string;
      boundingbox?: [string, string, string, string];
    }>
  >(url.toString());

  return data.map((item) => ({
    placeId: `nominatim:${item.place_id}`,
    label: item.display_name,
    lat: Number.parseFloat(item.lat),
    lng: Number.parseFloat(item.lon),
    boundingBox: parseBoundingBox(item.boundingbox),
  }));
}

async function queryPhoton(
  searchQuery: string,
  limit: number,
): Promise<GeocodeResult[]> {
  const url = new URL(PHOTON_URL);
  url.searchParams.set('q', searchQuery);
  url.searchParams.set('limit', String(Math.max(limit, 5)));
  url.searchParams.set('lang', 'en');

  const data = await fetchJson<{
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        osm_id?: number;
        osm_type?: string;
        name?: string;
        street?: string;
        district?: string;
        city?: string;
        county?: string;
        state?: string;
        country?: string;
        countrycode?: string;
        type?: string;
        extent?: [number, number, number, number];
      };
    }>;
  }>(url.toString());

  const results: GeocodeResult[] = [];

  for (const feature of data.features || []) {
    const props = feature.properties || {};
    const coordinates = feature.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) {
      continue;
    }

    const [lng, lat] = coordinates;
    const label = buildLabel([
      props.name,
      props.street,
      props.district,
      props.city,
      props.county,
      props.state,
      props.country || 'Kenya',
    ]);

    if (!isKenyaResult(props.countrycode, label)) {
      continue;
    }

    // Photon extent is [west, south, east, north]
    const extent = props.extent;
    const boundingBox = extent
      ? parseBoundingBox([
          String(extent[1]),
          String(extent[3]),
          String(extent[0]),
          String(extent[2]),
        ])
      : undefined;

    results.push({
      placeId: `photon:${props.osm_type || 'x'}:${props.osm_id || `${lat},${lng}`}`,
      label: label || searchQuery,
      lat,
      lng,
      boundingBox,
    });

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}

function scoreAreaResult(result: GeocodeResult, needle: string) {
  const label = result.label.toLowerCase();
  const target = needle.toLowerCase();
  let score = 0;

  if (label.includes(target)) {
    score += 5;
  }

  for (const part of target.split(/[\s/,]+/).filter(Boolean)) {
    if (part.length > 2 && label.includes(part)) {
      score += 1;
    }
  }

  if (/\b(ward|constituency|county|boundary)\b/i.test(result.label)) {
    score += 3;
  }

  return score;
}

function dedupeResults(results: GeocodeResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.lat.toFixed(5)}:${result.lng.toFixed(5)}:${result.label.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function searchLocations(
  searchQuery: string,
  limit: number,
  options?: { preferArea?: boolean; areaNeedle?: string },
): Promise<GeocodeResult[]> {
  const cacheKey = `${options?.preferArea ? 'area' : 'q'}:${limit}:${searchQuery.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const errors: string[] = [];
  let results: GeocodeResult[] = [];

  try {
    results = await queryPhoton(searchQuery, limit);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Photon failed');
  }

  if (results.length === 0) {
    try {
      results = await queryNominatim(searchQuery, limit);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Nominatim failed');
    }
  } else if (results.length < limit) {
    try {
      const nominatimResults = await queryNominatim(searchQuery, limit);
      results = dedupeResults([...results, ...nominatimResults]).slice(
        0,
        limit,
      );
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Nominatim failed');
    }
  }

  if (results.length === 0 && errors.length > 0) {
    throw new Error(errors.join('; ') || 'Geocoding service unavailable');
  }

  if (options?.preferArea && options.areaNeedle) {
    results = [...results].sort(
      (a, b) =>
        scoreAreaResult(b, options.areaNeedle!) -
        scoreAreaResult(a, options.areaNeedle!),
    );
  }

  const finalResults = dedupeResults(results).slice(0, limit);
  setCached(cacheKey, finalResults);
  return finalResults;
}

function areaQueries(input: {
  county?: string | null;
  constituency?: string | null;
  ward?: string | null;
}) {
  const { county, constituency, ward } = input;
  const queries: string[] = [];

  if (ward && constituency && county) {
    queries.push(`${ward} ward, ${constituency}, ${county}, Kenya`);
    queries.push(`${ward}, ${constituency} constituency, ${county}, Kenya`);
    queries.push(`${ward}, ${county}, Kenya`);
  } else if (constituency && county) {
    queries.push(`${constituency} constituency, ${county}, Kenya`);
    queries.push(`${constituency}, ${county}, Kenya`);
  } else if (county) {
    queries.push(`${county} County, Kenya`);
    queries.push(`${county}, Kenya`);
  }

  return [
    ...new Set(queries.map((query) => query.replace(/\s+/g, ' ').trim())),
  ];
}

function landmarkQueries(
  query: string,
  county?: string | null,
  constituency?: string | null,
  ward?: string | null,
) {
  const queries = [
    [query, ward, constituency, county, 'Kenya'].filter(Boolean).join(', '),
    [query, constituency, county, 'Kenya'].filter(Boolean).join(', '),
    [query, county, 'Kenya'].filter(Boolean).join(', '),
    `${query}, Kenya`,
  ];

  return [
    ...new Set(queries.map((value) => value.replace(/\s+/g, ' ').trim())),
  ];
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
      const queries = areaQueries({ county, constituency, ward });
      if (queries.length === 0) {
        return NextResponse.json({ results: [] });
      }

      const needle = ward || constituency || county || '';
      let results: GeocodeResult[] = [];

      for (const searchQuery of queries) {
        results = await searchLocations(searchQuery, 5, {
          preferArea: true,
          areaNeedle: needle,
        });
        if (results.length > 0) {
          break;
        }
      }

      return NextResponse.json({ results: results.slice(0, 1) });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const queries = landmarkQueries(query, county, constituency, ward);
    let results: GeocodeResult[] = [];

    for (const searchQuery of queries) {
      results = await searchLocations(searchQuery, 8);
      if (results.length > 0) {
        break;
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[api/geocode] Failed to geocode:', error);
    return NextResponse.json(
      { error: 'Failed to search locations', results: [] },
      { status: 500 },
    );
  }
}
