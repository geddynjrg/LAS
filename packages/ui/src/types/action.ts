export type ActionResponse<T extends Record<string, unknown>> =
  | {
      success?: false;
      message?: string;
      errors?: {
        [K in keyof T]?: string[];
      };
      values: T;
    }
  | {
      success: true;
      message?: string;
      data?: T;
      errors?: undefined;
      values?: undefined;
    };
