"use client";

import { IconArrowRight, IconMinus, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState, type FC, type ReactNode } from "react";

import { Select } from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Tag } from "@workspace/ui/components/tag";
import { Underline } from "@workspace/ui/components/underline";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { cn } from "@workspace/ui/lib/utils";

import { type CourseData, type CourseDataResponse } from "@/api/courses";
import { SortIndicator } from "@/components/sort-indicator";

export interface CoursesTableProps {
  data: CourseDataResponse;
  children?: ReactNode;
}

type ColumnDef = {
  key: string;
  label: string;
  sortable: boolean;
  className?: string;
};

// Course table column definitions
const columns: ColumnDef[] = [
  { key: "title", label: "Course name", sortable: true },
  { key: "location", label: "Location", sortable: true },
  {
    key: "courseFee",
    label: "Fee",
    sortable: true,
    className: "hidden sm:table-cell",
  },
  {
    key: "duration",
    label: "Duration",
    sortable: true,
    className: "hidden md:table-cell",
  },
];

export const CoursesDataTable: FC<CoursesTableProps> = ({ data, children }) => {
  const [openRowIndex, setOpenRowIndex] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const orderBy = searchParams.get("orderBy");
  const sort = String(searchParams.get("sort"));
  const currentPage = Number(searchParams.get("page") ?? 1);

  // split order into column and direction (asc/desc)

  const handleOrderByChange = (column: string, sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("orderBy", column);
    params.set(
      "sort",
      column == orderBy && sort.toLowerCase() === "asc" ? "Desc" : "Asc",
    );
    console.log("handleOrderByChange", {
      column,
      sort,
      path: `${pathname}?${params.toString()}`,
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleItemCountChange = useDebounce((value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("take", value);
    router.replace(`${pathname}?${params.toString()}`);
  }, 500);

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <div className="text-border">
            Showing {`${data.page * data.take} of ${data.total}`} results
          </div>
          <div className="flex items-center gap-2">
            <p className="text-border">Show</p>
            <Select
              options={[
                { label: "10", value: "10" },
                { label: "20", value: "20" },
                { label: "30", value: "30" },
              ]}
              className="w-21"
              placeholder={data.take}
              onValueChange={handleItemCountChange}
            />
          </div>
        </div>
      </div>
      <div className="border-table-border mt-4 overflow-clip rounded-xl border">
        <Table className="w-full">
          <TableHeader className="bg-neutral-200">
            <TableRow className="border-table-border">
              <TableHead className="w-10" />
              {columns.map((column, index) => (
                <TableHead key={index} scope="col" className={column.className}>
                  <button
                    className={cn(
                      "flex w-full items-center gap-1 p-4",
                      column.sortable && "cursor-pointer",
                    )}
                    onClick={
                      column.sortable
                        ? () => handleOrderByChange(column.key, sort)
                        : undefined
                    }
                  >
                    {column.label}
                    <SortIndicator
                      hasSort={column.sortable}
                      order={column.key === orderBy ? sort : undefined}
                    />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item, index) => (
              <CoursesRow
                isOpen={index == openRowIndex}
                onClick={() => {
                  console.log("clicked", {
                    index: index,
                    openRowIndex: openRowIndex,
                  });

                  setOpenRowIndex(index === openRowIndex ? null : index);
                }}
                key={index}
                {...item}
              />
            ))}
            <TableRow>
              <TableCell colSpan={5} className="py-2">
                {children}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
};

const DetailsRow: FC<{
  className?: string;
  children?: ReactNode;
  isOpen: boolean;
}> = ({ children, isOpen, className }) => {
  return (
    <TableRow
      className={cn(
        className,
        // isOpen ? "border-table-border border-b" : "hidden",
      )}
    >
      <TableCell colSpan={5} className="bg-theme-100 p-0">
        {children}
      </TableCell>
    </TableRow>
  );
};

interface courseRowProps extends CourseData {
  isOpen: boolean;
  onClick?: () => void;
}

export const CoursesRow: FC<courseRowProps> = (props) => {
  return (
    <Fragment>
      <TableRow onClick={props.onClick} className="border-table-border">
        <TableCell className="cursor-pointer">
          {props.isOpen ? (
            <IconMinus className="text-foreground" />
          ) : (
            <IconPlus className="text-foreground" />
          )}
        </TableCell>
        <TableCell className="text-link whitespace-normal p-4 font-bold">
          {props.title}
        </TableCell>
        <TableCell className="p-4">{props.location}</TableCell>
        <TableCell className="hidden p-4 sm:table-cell">
          {props.courseFee}
        </TableCell>
        <TableCell className="hidden p-4 md:table-cell">
          {props.duration}
        </TableCell>
      </TableRow>
      <DetailsRow isOpen={props.isOpen} className={"border-0"}>
        <ItemDetails {...props} />
      </DetailsRow>
    </Fragment>
  );
};

const ItemDetails: FC<courseRowProps> = (props) => {
  return (
    <div
      className={cn(
        "overflow-hidden transition-[height] duration-300 ease-in-out",
        props.isOpen ? "h-70" : "h-0",
      )}
    >
      <div className="p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {props.tags.map((tag, index) => (
            <Tag key={index} className="tag">
              {tag}
            </Tag>
          ))}
        </div>
        <div>
          <span className="font-bold">Duration: </span>
          <span>{props.duration}</span>
        </div>
        <div className="mt-4">
          <span className="font-bold">Group size: </span>
          <span>{props.groupSize}</span>
        </div>

        <div className="mt-4">
          <span className="font-bold">Course fee: </span>
          <span>{props.courseFee}</span>
        </div>
        <div>
          <span className="font-bold">Application fee: </span>
          <span>{props.applicationFee}</span>
        </div>
        <div>
          <span className="font-bold">Test booking fee: </span>
          <span>{props.testBookingFee}</span>
        </div>
        <div className="mt-4">
          <span className="font-bold">Required education: </span>
          <span>{props.requiredEducation}</span>
        </div>
        <Link href={props.link}>
          <Underline className="mx-auto my-4">
            Go to course Page <IconArrowRight />
          </Underline>
        </Link>
      </div>
    </div>
  );
};
