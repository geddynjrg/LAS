import { useEffect } from "react";

import { usePrevious } from "@workspace/ui/hooks/usePrevious";

export function useFormSubmitted(isPending: boolean, cb: () => void) {
  const prevIsPending = usePrevious(isPending);

  useEffect(() => {
    if (prevIsPending && !isPending) {
      cb();
    }
  }, [isPending, prevIsPending, cb]);
}
