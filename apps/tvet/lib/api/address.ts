import { api } from "@/lib/api/utils";

export async function getCountryStates(countryCode: string) {
  return (
    await api.GET("/api/v1/address/countries/{country_code}/states", {
      params: {
        path: { country_code: countryCode },
      },
    })
  ).data?.data;
}
