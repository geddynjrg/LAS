/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * A mock path name function for the next/navigation outside of NextJS project.
 */
export const usePathname = () => {
  return "/mock/pathname";
};

/**
 * A mock router hook function for the next/navigation outside of NextJS project.
 */
export const useRouter = () => {
  return {
    back: () => {
      console.log("back");
    },
    forward: () => {
      console.log("forward");
    },
    refresh: () => {
      console.log("refresh");
    },
    push: (href: string, options?: { scroll?: boolean }) => {
      console.log("push", { href, options });
    },
    replace: (href: string, options?: { scroll?: boolean }) => {
      console.log("replace", { href, options });
    },
    prefetch: (
      href: string,
      options?: { kind: "auto" | "full" | "temporary" },
    ) => {
      console.log("prefetch", { href, options });
    },
  };
};

/**
 * A mock url params hook function for the next/navigation outside of NextJS project.
 *
 * *read only void function URLSearchParams by nextjs original design
 */
//
export function useSearchParams() {
  const params = [] as [string, string][];
  return {
    append: () => {},
    delete: () => {},
    set: () => {},
    sort: () => {},
    entries: () => {
      return [][Symbol.iterator]();
    },
    forEach: (
      fn: (
        this: string[][],
        value: string,
        name: string,
        searchParams: URLSearchParams,
      ) => void,
      thisArg?: string[][],
    ) => {},
    get: (name: string) => {
      return null;
    },
    getAll: (name: string) => {
      return [];
    },
    has: (name: string, value?: string) => {
      return false;
    },
    keys: () => params.map((param) => param[0] || "")[Symbol.iterator](),
    size: 0,
    values: () => {
      return [][Symbol.iterator]();
    },
    toString: () => params.toString(),
    [Symbol.iterator]: function* (): Generator<
      [string, string],
      undefined,
      unknown
    > {
      for (const param of params) {
        yield param as [string, string];
      }
      return undefined;
    },
  };
}

export function useSelectedLayoutSegments(parallelRouteKey?: string) {
  return [];
}

export function useSelectedLayoutSegment(parallelRouteKey?: string) {
  return null;
}
