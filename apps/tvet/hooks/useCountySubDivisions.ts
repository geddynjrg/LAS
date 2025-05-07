import { useEffect, useState } from "react";

import { clientApi } from "@/lib/api/client-api";

export function useCountrySubdivisions(countyId?: number) {
  const [subdivisions, setSubdivisions] = useState<
    {
      id?: string;
      name?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const loadSubdivisions = async (countyId: number) => {
    if (!countyId) {
      return;
    }

    setLoading(true);
    try {
      // TODO: wait for API fix to get the subdivisions
      const subdivisions = await clientApi.GET(
        "/api/v1/address/countries/{country_code}/subdivisions",
        {
          params: {
            path: { country_code: "KE" },
            query: { parent_id: countyId.toString() },
          },
        },
      );
      setSubdivisions(subdivisions.data?.data ?? []);
    } catch (error) {
      console.warn("Failed to load country subdivisions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countyId) {
      loadSubdivisions(countyId);
    }
  }, [countyId]);

  return [subdivisions, loading] as const;
}
