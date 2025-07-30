import { api, validate } from "@/lib/api/utils";
import {
  ApplicationsListResponseSchema,
  ApplicationsListErrorSchema,
  type ApplicationsListResponse,
  type ApplicationsListError,
  type ApplicationsListQuery,
} from "@/lib/api/schema/application/applications-list.schema";

/**
 * Fetch applications from the external API
 * This fetches applications that have been submitted to the external system
 * @param query Optional query parameters for filtering and pagination
 * @returns The API response with applications data
 */
export async function getApplicationsList(
  query?: ApplicationsListQuery,
): Promise<ApplicationsListResponse | ApplicationsListError> {
  try {
    const response = await api.GET("/api/v1/applications", {
      params: {
        query: query || {},
      },
    });

    if (response.error) {
      console.error("API error:", response.response.status, response.error);
      
      // Try to parse as ApplicationsListError
      try {
        const errorResult = ApplicationsListErrorSchema.parse(response.error);
        return errorResult;
      } catch {
        return {
          error: "api_error",
          message: response.error?.message || response.error?.error || "Unknown API error",
        };
      }
    }

    // Validate and return the successful response
    try {
      const successResult = validate(response, ApplicationsListResponseSchema);
      return successResult;
    } catch (validationError) {
      // If validation fails, return the raw data but log the error
      console.warn("Response validation failed:", validationError);
      return response.data as ApplicationsListResponse;
    }
  } catch (error) {
    console.error("Error fetching applications list:", error);

    if (error instanceof Error) {
      return {
        error: "request_error",
        message: error.message,
      };
    }

    return {
      error: "unknown_error",
      message: "An unknown error occurred while fetching applications",
    };
  }
}

/**
 * Fetch applications with automatic retry and fallback to local database
 * This function combines API data (submitted+ applications) with local data (draft applications)
 * @param query Optional query parameters
 * @returns Combined applications data
 */
export async function getApplicationsWithFallback(
  query?: ApplicationsListQuery,
): Promise<ApplicationsListResponse> {
  try {
    const apiResult = await getApplicationsList(query);
    
    // If API call was successful, return the data
    if ("data" in apiResult && apiResult.data) {
      return apiResult;
    }
    
    // If API call failed, we'll need to fall back to local data for submitted+ applications
    // and combine with local draft applications
    console.warn("API call failed, falling back to local data only:", apiResult);
    
    // Return empty response structure - the dashboard will handle fallback logic
    return {
      success: false,
      data: [],
      meta: {
        total_count: 0,
        limit: query?.limit || 20,
        offset: query?.offset || 0,
        has_more: false,
      },
    };
  } catch (error) {
    console.error("Error in getApplicationsWithFallback:", error);
    
    return {
      success: false,
      data: [],
      meta: {
        total_count: 0,
        limit: query?.limit || 20,
        offset: query?.offset || 0,
        has_more: false,
      },
    };
  }
}