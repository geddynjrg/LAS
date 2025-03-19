"use client";

import { IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { FC, FormEvent } from "react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

export interface SearchCoursesFormProps {
  placeholder?: string;
  classname?: string;
}

export const SearchCoursesForm: FC<SearchCoursesFormProps> = ({
  placeholder,
  classname,
}) => {
  const router = useRouter();

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const search = formData.get("search") as string;

    router.push(`/courses?search=${encodeURIComponent(search.trim())}`);
  }

  return (
    <form className={classname} onSubmit={handleSearch}>
      <Input
        name="search"
        placeholder={placeholder}
        endDecorator={
          <Button type="submit" variant="ghost" size="sm">
            <IconSearch />
          </Button>
        }
      />
    </form>
  );
};
