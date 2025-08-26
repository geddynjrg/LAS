import { getLocale } from 'next-intl/server';
import { z } from 'zod';

// Schema for constituency
const ConstituencySchema = z.object({
  tid: z.number(),
  name: z.string(),
});

// Schema for county
const CountySchema = z.object({
  tid: z.number(),
  name: z.string(),
  constituencies: z.array(ConstituencySchema),
});

// Schema for the full API response
const CountiesResponseSchema = z.object({
  data: z.array(CountySchema),
  meta: z.object({
    total_counties: z.number(),
    total_constituencies: z.number(),
  }),
});

export type Constituency = z.infer<typeof ConstituencySchema>;
export type County = z.infer<typeof CountySchema>;
export type CountiesResponse = z.infer<typeof CountiesResponseSchema>;

export async function getCounties() {
  const locale = await getLocale();
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error('API_URL environment variable is not configured');
  }

  const response = await fetch(`${apiUrl}/api/v1/application/counties`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Language': locale,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch counties: ${response.statusText}`);
  }

  const data = await response.json();
  return CountiesResponseSchema.parse(data);
}
