"use client";

import * as Popover from "@radix-ui/react-popover";
import { IconLoader, IconMapPin, IconSearch } from "@tabler/icons-react";
import { Command as CommandPrimitive } from "cmdk";
import { useCallback, useEffect, useId, useState, type FC } from "react";
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

export interface GeocodeSuggestion {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
}

export interface LandmarkMapInputProps extends Omit<InputProps, "onValueChange"> {
  locationContext?: LandmarkLocationContext;
  onValueChange?: (value: string) => void;
  onLocationSelect?: (location: GeocodeSuggestion | null) => void;
}

const DEFAULT_CENTER = { lat: -1.2921, lng: 36.8219 };

function buildMapEmbedUrl(lat: number, lng: number) {
  const delta = 0.015;
  const bbox = [
    lng - delta,
    lat - delta,
    lng + delta,
    lat + delta,
  ].join("%2C");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function buildMapLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

function shortLabel(label: string) {
  return label.split(",").slice(0, 3).join(", ").trim();
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

  const fetchSuggestions = useDebouncedCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({ q: query.trim() });

      if (locationContext?.county) {
        params.set("county", locationContext.county);
      }
      if (locationContext?.constituency) {
        params.set("constituency", locationContext.constituency);
      }
      if (locationContext?.ward) {
        params.set("ward", locationContext.ward);
      }

      const response = await fetch(`/api/geocode?${params.toString()}`);
      const data = (await response.json()) as {
        results?: GeocodeSuggestion[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Location search failed");
      }

      setSuggestions(data.results || []);
      const results = data.results || [];
      setPreview(results[0] ?? null);
      setIsOpen(results.length > 0);
    } catch (error) {
      setSuggestions([]);
      setSearchError(
        error instanceof Error ? error.message : "Location search failed",
      );
    } finally {
      setIsLoading(false);
    }
  }, 400);

  useEffect(() => {
    if (!defaultValue) {
      return;
    }

    setSearch(defaultValue);
    void fetchSuggestions(defaultValue);
  }, [defaultValue, fetchSuggestions]);

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

  const mapCenter = selected
    ? { lat: selected.lat, lng: selected.lng }
    : preview
      ? { lat: preview.lat, lng: preview.lng }
      : DEFAULT_CENTER;

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
                    isLoading ? (
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
            src={buildMapEmbedUrl(mapCenter.lat, mapCenter.lng)}
            className="absolute inset-0 h-full w-full max-w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground min-w-0 break-words">
          {selected
            ? `Selected: ${shortLabel(selected.label)}`
            : preview
              ? `Showing: ${shortLabel(preview.label)}`
              : "Search for a landmark to pin its location on the map."}
        </p>
        {(selected || preview) && (
          <a
            href={buildMapLink(
              (selected ?? preview)!.lat,
              (selected ?? preview)!.lng,
            )}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-green-700 underline"
          >
            Open in OpenStreetMap
          </a>
        )}
      </div>
    </div>
  );
};
