import { z } from "zod";

/**
 * {
    "current_page": 2,
    "page_size": 2,
    "total_items": 5,
    "total_pages": 3,
    "has_next_page": true,
    "has_previous_page": true,
    "next_page_url": "/api/v1/resolve?page=3&per_page=2",
    "previous_page_url": "/api/v1/resolve?page=1&per_page=2",
    "first_page_url": "/api/v1/resolve?page=1&per_page=2",
    "last_page_url": "/api/v1/resolve?page=3&per_page=2"
}
 */
export const PaginationSchema = z.object({
  current_page: z.number(),
  page_size: z.number(),
  total_items: z.number(),
  total_pages: z.number(),
  has_next_page: z.boolean(),
  has_previous_page: z.boolean(),
  next_page_url: z.string().nullable(),
  previous_page_url: z.string().nullable(),
  first_page_url: z.string().nullable(),
  last_page_url: z.string().nullable(),
});
