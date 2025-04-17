"use client";

import { IconArrowRight, IconMinus, IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState, type FC, type ReactNode } from "react";

import { Currency } from "@workspace/ui/components/currency";
import { Select } from "@workspace/ui/components/select";
import { SortIndicator } from "@workspace/ui/components/sort-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Tag } from "@workspace/ui/components/tag";
import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

import type { CourseType } from "@/lib/api/courses";

export interface CoursesTableProps {
  courses: CourseType[];
  pagination?: {
    total: number;
    limit: number;
  };
  children?: ReactNode;
}

export const CoursesDataTable: FC<CoursesTableProps> = ({
  courses,
  pagination,
  children,
}) => {
  const t = useTranslations("CoursesPage");
  const [openRowIndex, setOpenRowIndex] = useState<string>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const sort = searchParams.get("sort");
  const direction = searchParams.get("direction")?.toLowerCase();

  const handleOrderByChange = (column: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", column);

    if (!direction || sort !== column) {
      params.set("direction", "asc");
    } else if (direction === "asc") {
      params.set("direction", "desc");
    } else {
      params.delete("direction");
      params.delete("sort");
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleItemCountChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("take", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  function getDirection(column: string) {
    if (sort === column) {
      return direction;
    }

    return undefined;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <PaginationResults {...pagination} />

        <div className="flex items-center gap-2">
          <p className="text-border">{t("show")}</p>
          <Select
            defaultValue={
              searchParams.get("take") ?? pagination?.limit.toString()
            }
            name="itemCount"
            options={[
              { label: "12", value: "12" },
              { label: "24", value: "24" },
              { label: "36", value: "36" },
            ]}
            className="w-21"
            placeholder={pagination?.limit}
            onValueChange={handleItemCountChange}
          />
        </div>
      </div>

      <div className="border-table-border mt-4 overflow-clip rounded-xl border">
        <Table className="w-full">
          <TableHeader className="bg-neutral-200">
            <TableRow className="border-table-border">
              <TableHead scope="col" colSpan={2}>
                <SortButton
                  direction={getDirection("title")}
                  onClick={() => handleOrderByChange("title")}
                >
                  {t("courseName")}
                </SortButton>
              </TableHead>
              <TableHead scope="col">
                <SortButton
                  direction={getDirection("institution")}
                  onClick={() => handleOrderByChange("institution")}
                >
                  {t("location")}
                </SortButton>
              </TableHead>
              <TableHead scope="col" className="max-md:hidden">
                {t("fee")}
              </TableHead>
              <TableHead scope="col" className="max-md:hidden">
                {t("duration")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {courses.map((course) => (
              <CoursesRow
                key={course.id}
                isOpen={course.id === openRowIndex}
                onClick={() => {
                  setOpenRowIndex(
                    course.id === openRowIndex ? undefined : course.id,
                  );
                }}
                {...course}
              />
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="py-2">
                {children}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  );
};

const SortButton: FC<{
  direction?: string;
  onClick?: () => unknown;
  children?: ReactNode;
}> = ({ direction, onClick, children }) => {
  return (
    <button
      className="flex w-full cursor-pointer items-center gap-1 px-2 py-4"
      onClick={onClick}
    >
      {children}
      <SortIndicator direction={direction} />
    </button>
  );
};

interface courseRowProps extends CourseType {
  isOpen: boolean;
  onClick?: () => void;
}

export const CoursesRow: FC<courseRowProps> = (props) => {
  return (
    <Fragment>
      <TableRow onClick={props.onClick} className="border-table-border">
        <TableCell className="cursor-pointer pr-0">
          {props.isOpen ? (
            <IconMinus className="text-foreground" />
          ) : (
            <IconPlus className="text-foreground" />
          )}
        </TableCell>
        <TableCell className="text-link whitespace-normal font-bold">
          {props.title}
        </TableCell>
        <TableCell className="whitespace-normal">
          {props.content.institution.title}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          {props.content.course_fee ? (
            <Currency amount={props.content.course_fee} currency="KES" />
          ) : (
            "none"
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {props.content.duration}
        </TableCell>
      </TableRow>
      <TableRow className="border-0">
        <TableCell colSpan={5} className="bg-theme-100 p-0">
          <ItemDetails {...props} />
        </TableCell>
      </TableRow>
    </Fragment>
  );
};

const ItemDetails: FC<courseRowProps> = (props) => {
  const t = useTranslations("CoursesPage");

  return (
    <div
      className={cn(
        "overflow-hidden transition-[height] duration-300 ease-in-out",
        props.isOpen ? "h-70" : "h-0",
      )}
    >
      <div className="p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {props.content.tags?.map((tag, index) => (
            <Tag key={index} className="tag">
              {tag}
            </Tag>
          ))}
        </div>

        {props.content.duration && (
          <div>
            <span className="font-bold">{t("duration")}: </span>
            <span>{props.content.duration}</span>
          </div>
        )}

        {props.content.group_size && (
          <div className="mt-4">
            <span className="font-bold">{t("groupSize")}: </span>
            <span>{props.content.group_size}</span>
          </div>
        )}

        {props.content.course_fee && (
          <div className="mt-4">
            <span className="font-bold">{t("courseFee")}: </span>
            <span>
              <Currency amount={props.content.course_fee} currency="KES" />
            </span>
          </div>
        )}

        {props.content.application_fee && (
          <div>
            <span className="font-bold">{t("applicationFee")}: </span>
            <span>
              <Currency amount={props.content.application_fee} currency="KES" />
            </span>
          </div>
        )}

        {props.content.test_booking_fee && (
          <div>
            <span className="font-bold">{t("testBookingFee")}: </span>
            <span>
              <Currency
                amount={props.content.test_booking_fee}
                currency="KES"
              />
            </span>
          </div>
        )}

        {props.content.education_level.length > 0 && (
          <div className="mt-4">
            <span className="font-bold">{t("requiredEducation")}: </span>
            <span>{props.content.education_level.join(", ")}</span>
          </div>
        )}

        {props.path_alias && (
          <Link href={props.path_alias}>
            <Underline className="mx-auto my-4">
              {t("goToCourse")} <IconArrowRight />
            </Underline>
          </Link>
        )}
      </div>
    </div>
  );
};

const PaginationResults: FC<{
  limit?: number;
  total?: number;
}> = ({ limit, total }) => {
  const t = useTranslations("CoursesPage");

  if (!limit || !total || limit >= total) {
    return <div />;
  }

  return (
    <div className="text-border">
      {t("paginationResults", { amount: limit, total })}
    </div>
  );
};
