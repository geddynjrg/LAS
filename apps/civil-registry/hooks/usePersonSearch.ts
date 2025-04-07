import { useState } from "react";

import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounce";

import type { Person, SexType } from "@/lib/data/person";
import { searchPerson } from "@/lib/services/birth-registration-service";

export function usePersonSearch(sex?: SexType) {
  const [searchedText, setSearchedText] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [searchedPersonList, setSearchedPersonList] = useState<Person[]>([]);

  const debouncedSearch = useDebouncedCallback(async (search?: string) => {
    if (search === searchedText) {
      return;
    }

    if (!search) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    setSearchedText(search);

    const res = await searchPerson(search, sex);

    const options = res.map((person) => ({
      label: `${person.firstName} ${person.lastName} (${person.nationalId})`,
      value: person.nationalId ?? "",
    }));

    setOptions(options);
    setIsLoading(false);
    setSearchedPersonList(res);
  }, 300);

  const onValueChange = (value: string | undefined) => {
    if (!value || value === searchedText) {
      return;
    }

    debouncedSearch(value);
  };

  const findByNationalId = (nationalId: string) => {
    const person = searchedPersonList.find(
      (person) => person.nationalId === nationalId,
    );
    return person;
  };

  return {
    onValueChange,
    isLoading,
    options,
    findByNationalId,
  };
}
