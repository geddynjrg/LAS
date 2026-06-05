// lib/utils/url.ts
export function resolveApiUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const apiParsed = new URL(apiUrl);
      parsed.protocol = apiParsed.protocol;
      parsed.hostname = apiParsed.hostname;
      parsed.port = apiParsed.port;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
