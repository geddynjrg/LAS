"use client";

import * as Popover from "@radix-ui/react-popover";
import { IconLoader, IconMapPin, IconSearch } from "@tabler/icons-react";
import { Command as CommandPrimitive } from "cmdk";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Input, type InputProps } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

export interface LandmarkLocationContext {
  county?: string;
  constituency?: string;
  ward?: string;
}

export interface GeocodeBoundingBox {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface GeocodeSuggestion {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
  boundingBox?: GeocodeBoundingBox;
}

export interface LandmarkMapInputProps extends Omit<InputProps, "onValueChange"> {
  locationContext?: LandmarkLocationContext;
  onValueChange?: (value: string) => void;
  onLocationSelect?: (location: GeocodeSuggestion | null) => void;
}

const DEFAULT_CENTER = { lat: -1.2921, lng: 36.8219 };

const ZOOM_DELTAS = {
  default: 0.45,
  county: 0.32,
  constituency: 0.09,
  ward: 0.028,
  landmark: 0.012,
} as const;

type MapView = {
  lat: number;
  lng: number;
  delta: number;
  bounds?: GeocodeBoundingBox;
  label?: string;
};

function buildMapEmbedUrl(view: MapView) {
  const bbox =
    view.bounds != null
      ? [
          view.bounds.west,
          view.bounds.south,
          view.bounds.east,
          view.bounds.north,
        ].join("%2C")
      : [
          view.lng - view.delta,
          view.lat - view.delta,
          view.lng + view.delta,
          view.lat + view.delta,
        ].join("%2C");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${view.lat}%2C${view.lng}`;
}

function buildMapLink(view: MapView) {
  const zoom = deltaToZoom(view.delta);
  return `https://www.openstreetmap.org/?mlat=${view.lat}&mlon=${view.lng}#map=${zoom}/${view.lat}/${view.lng}`;
}

function deltaToZoom(delta: number) {
  if (delta >= 0.3) {
    return 9;
  }
  if (delta >= 0.1) {
    return 11;
  }
  if (delta >= 0.05) {
    return 13;
  }
  if (delta >= 0.02) {
    return 14;
  }

  return 16;
}

function shortLabel(label: string) {
  return label.split(",").slice(0, 3).join(", ").trim();
}

function suggestionFromResult(result: GeocodeSuggestion): GeocodeSuggestion {
  return {
    placeId: result.placeId,
    label: result.label,
    lat: result.lat,
    lng: result.lng,
    boundingBox: result.boundingBox,
  };
}

function mapViewFromSuggestion(
  suggestion: GeocodeSuggestion,
  delta: number,
): MapView {
  return {
    lat: suggestion.lat,
    lng: suggestion.lng,
    delta,
    bounds: suggestion.boundingBox,
    label: shortLabel(suggestion.label),
  };
}

export const LandmarkMapInput: FC<LandmarkMapInputProps> = ({
  id,
  name,
  defaultValue = "",
  placeholder,
  disabled,
  locationContext,
  onValueChange,
  onLocationSelect,
  className,
  ...props
}) => {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  const listboxId = `${inputId}-landmark-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(defaultValue);
  const [selected, setSelected] = useState<GeocodeSuggestion | null>(null);
  const [preview, setPreview] = useState<GeocodeSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [areaView, setAreaView] = useState<MapView | null>(null);
  const [isAreaLoading, setIsAreaLoading] = useState(false);

  const locationContextRef = useRef(locationContext);
  locationContextRef.current = locationContext;

  const suggestionCacheRef = useRef(new Map<string, GeocodeSuggestion[]>());
  const fetchAbortRef = useRef<AbortController | null>(null);
  const areaAbortRef = useRef<AbortController | null>(null);

  const buildContextCacheKey = useCallback((query: string) => {
    const context = locationContextRef.current;
    return [
      query.trim().toLowerCase(),
      context?.county?.trim().toLowerCase() || "",
      context?.constituency?.trim().toLowerCase() || "",
      context?.ward?.trim().toLowerCase() || "",
    ].join("|");
  }, []);

  const updateSelection = useCallback(
    (location: GeocodeSuggestion | null, value: string) => {
      setSelected(location);
      setPreview(location);
      setSearch(value);
      onValueChange?.(value);
      onLocationSelect?.(location);
    },
    [onLocationSelect, onValueChange],
  );

  const fetchSuggestionsNow = useCallback(async (query: string) => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      setPreview(null);
      return;
    }

    const cacheKey = buildContextCacheKey(trimmed);
    const cached = suggestionCacheRef.current.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setPreview(cached[0] ?? null);
      setIsOpen(cached.length > 0);
      setSearchError(null);
      return;
    }

    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setIsLoading(true);
    setSearchError(null);

    try {
      const context = locationContextRef.current;
      const params = new URLSearchParams({ q: trimmed });

      if (context?.county) {
        params.set("county", context.county);
      }
      if (context?.constituency) {
        params.set("constituency", context.constituency);
      }
      if (context?.ward) {
        params.set("ward", context.ward);
      }

      const response = await fetch(`/api/geocode?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        results?: GeocodeSuggestion[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Location search failed");
      }

      const results = (data.results || []).map(suggestionFromResult);
      suggestionCacheRef.current.set(cacheKey, results);
      setSuggestions(results);
      setPreview(results[0] ?? null);
      setIsOpen(results.length > 0);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setSuggestions([]);
      setSearchError(
        error instanceof Error ? error.message : "Location search failed",
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [buildContextCacheKey]);

  const fetchSuggestions = useDebouncedCallback(fetchSuggestionsNow, 180);

  const loadAreaView = useCallback(async (context: LandmarkLocationContext) => {
    if (!context.county?.trim()) {
      setAreaView(null);
      return;
    }

    areaAbortRef.current?.abort();
    const controller = new AbortController();
    areaAbortRef.current = controller;

    const delta = context.ward?.trim()
      ? ZOOM_DELTAS.ward
      : context.constituency?.trim()
        ? ZOOM_DELTAS.constituency
        : ZOOM_DELTAS.county;

    setIsAreaLoading(true);

    try {
      const params = new URLSearchParams({ type: "area" });
      params.set("county", context.county.trim());

      if (context.constituency?.trim()) {
        params.set("constituency", context.constituency.trim());
      }
      if (context.ward?.trim()) {
        params.set("ward", context.ward.trim());
      }

      const response = await fetch(`/api/geocode?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        results?: GeocodeSuggestion[];
      };

      const match = data.results?.[0];
      if (!match) {
        return;
      }

      setAreaView(
        mapViewFromSuggestion(suggestionFromResult(match), delta),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsAreaLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!defaultValue) {
      return;
    }

    setSearch(defaultValue);
    void fetchSuggestionsNow(defaultValue);
  }, [defaultValue, fetchSuggestionsNow]);

  useEffect(() => {
    void loadAreaView(locationContext || {});
  }, [
    locationContext?.county,
    locationContext?.constituency,
    locationContext?.ward,
    loadAreaView,
    locationContext,
  ]);

  useEffect(() => {
    if (!search || search.trim().length < 2) {
      return;
    }

    void fetchSuggestionsNow(search);
  }, [
    locationContext?.county,
    locationContext?.constituency,
    locationContext?.ward,
    search,
    fetchSuggestionsNow,
  ]);

  useEffect(() => {
    if (suggestions.length !== 1 || selected || !search) {
      return;
    }

    const [match] = suggestions;
    if (
      match &&
      shortLabel(match.label).toLowerCase() === search.trim().toLowerCase()
    ) {
      updateSelection(match, shortLabel(match.label));
    }
  }, [search, selected, suggestions, updateSelection]);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
      areaAbortRef.current?.abort();
      fetchSuggestions.cancel();
    };
  }, [fetchSuggestions]);

  const mapView = useMemo<MapView>(() => {
    if (selected) {
      return mapViewFromSuggestion(selected, ZOOM_DELTAS.landmark);
    }

    if (preview && search.trim().length >= 2) {
      return mapViewFromSuggestion(preview, ZOOM_DELTAS.landmark);
    }

    if (areaView) {
      return areaView;
    }

    return {
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng,
      delta: ZOOM_DELTAS.default,
    };
  }, [areaView, preview, search, selected]);

  const mapStatusLabel = selected
    ? `Selected: ${shortLabel(selected.label)}`
    : preview && search.trim().length >= 2
      ? `Showing: ${shortLabel(preview.label)}`
      : areaView?.label
        ? `Area: ${areaView.label}`
        : "Search for a landmark to pin its location on the map.";

  return (
    <div className={cn("min-w-0 max-w-full space-y-3", className)}>
      <input type="hidden" name={name} value={search} />

      <div className="min-w-0 max-w-full">
        <Popover.Root open={isOpen && !disabled}>
          <Command shouldFilter={false} loop>
            <Popover.Trigger asChild>
              <CommandPrimitive.Input
                asChild
                id={inputId}
                value={search}
                disabled={disabled}
                placeholder={placeholder}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setIsOpen(true);
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => setIsOpen(false), 150);
                }}
                onValueChange={(value) => {
                  setSearch(value);
                  onValueChange?.(value);
                  setSelected(null);
                  setPreview(null);
                  onLocationSelect?.(null);
                  void fetchSuggestions(value);
                }}
              >
                <Input
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  endDecorator={
                    isLoading || isAreaLoading ? (
                      <IconLoader className="size-4 animate-spin" />
                    ) : (
                      <IconSearch className="size-4" />
                    )
                  }
                  {...props}
                />
              </CommandPrimitive.Input>
            </Popover.Trigger>

            {!isOpen && <CommandList aria-hidden="true" className="hidden" />}

            <Popover.Content
              asChild
              align="start"
              onOpenAutoFocus={(event) => event.preventDefault()}
              className="z-20 mt-1 w-(--radix-popover-trigger-width) rounded-md border bg-white shadow-md"
            >
              <CommandList id={listboxId} role="listbox">
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.placeId}
                      value={suggestion.label}
                      onMouseDown={(event) => event.preventDefault()}
                      onSelect={() => {
                        updateSelection(
                          suggestion,
                          shortLabel(suggestion.label),
                        );
                        setIsOpen(false);
                      }}
                    >
                      <IconMapPin className="mr-2 size-4 shrink-0 text-green-600" />
                      <span className="line-clamp-2">{suggestion.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Popover.Content>
          </Command>
        </Popover.Root>
      </div>

      {searchError && (
        <p className="text-destructive text-sm">{searchError}</p>
      )}

      {!searchError && search.length >= 2 && !isLoading && suggestions.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No matching locations found. Try a more specific landmark name.
        </p>
      )}

      <div className="relative w-full max-w-full min-w-0 overflow-hidden rounded-md border bg-neutral-50">
        <div className="relative aspect-[16/10] w-full max-w-full">
          <iframe
            title="Selected landmark map"
            src={buildMapEmbedUrl(mapView)}
            className="absolute inset-0 h-full w-full max-w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground min-w-0 break-words">
          {mapStatusLabel}
        </p>
        <a
          href={buildMapLink(mapView)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-green-700 underline"
        >
          Open in OpenStreetMap
        </a>
      </div>
    </div>
  );
};
