import { useEffect, type EffectCallback } from "react";

export function useMount(callback: EffectCallback) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, []);
}
