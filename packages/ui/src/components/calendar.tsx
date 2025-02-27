"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTimeZone } from "next-intl";
import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type FC,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  DayPicker,
  labelNext,
  labelPrevious,
  useDayPicker,
} from "react-day-picker";

import { Button, buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export interface CalendarProps {
  value?: Date;
  onValueChange?: (date: Date) => void;
  yearRange?: number;
  showYearSwitcher?: boolean;
  showOutsideDays?: boolean;
  numberOfMonths?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

type NavView = "days" | "years";

export const Calendar: FC<CalendarProps> = ({
  value,
  onValueChange,
  showOutsideDays = true,
  showYearSwitcher = true,
  yearRange = 12,
  numberOfMonths,
  className,
  ...props
}) => {
  const timeZone = useTimeZone();

  const [navView, setNavView] = useState<NavView>("days");
  const [displayYears, setDisplayYears] = useState<{
    from: number;
    to: number;
  }>(
    useMemo(() => {
      const currentYear = new Date().getFullYear();

      return {
        from: currentYear - Math.floor(yearRange / 2 - 1),
        to: currentYear + Math.ceil(yearRange / 2),
      };
    }, [yearRange]),
  );

  const columnsDisplayed = navView === "years" ? 1 : numberOfMonths;

  return (
    <DayPicker
      required
      mode="single"
      timeZone={timeZone}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      style={{ width: 248.8 * (columnsDisplayed ?? 1) + "px" }}
      classNames={{
        months: "relative flex",
        month_caption: "relative mx-10 flex h-7 items-center justify-center",
        weekdays: "flex flex-row",
        weekday: "text-muted-foreground w-8 text-sm font-normal",
        month: "w-full",
        caption: "relative flex items-center justify-center pt-1",
        caption_label: "truncate text-sm font-medium",
        nav: "flex items-start",
        month_grid: "mx-auto mt-4",
        week: "mt-1 flex w-max items-start",
        day_button: cn(
          buttonVariants({ variant: "secondary" }),
          "size-8 rounded-md border-transparent p-0 text-sm font-normal",
        ),
        range_start: "bg-primary/70 rounded-l-md",
        range_middle: "bg-primary/70 [&>button]:bg-transparent",
        range_end: "bg-primary/70 rounded-r-md",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus-visible:bg-primary",
        today: "[&>button]:ring-1 [&>button]:ring-yellow-500",
        outside:
          "text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground opacity-50 aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible flex-1",
      }}
      components={{
        Nav: (props) => (
          <Nav
            displayYears={displayYears}
            navView={navView}
            setDisplayYears={setDisplayYears}
            {...props}
          />
        ),
        CaptionLabel: (props) => (
          <CaptionLabel
            showYearSwitcher={showYearSwitcher}
            navView={navView}
            setNavView={setNavView}
            displayYears={displayYears}
            {...props}
          />
        ),
        MonthGrid: (props) => (
          <MonthGrid
            displayYears={displayYears}
            navView={navView}
            setNavView={setNavView}
            {...props}
          />
        ),
      }}
      numberOfMonths={columnsDisplayed}
      selected={value}
      onSelect={onValueChange}
      {...props}
    />
  );
};

interface NavProps {
  className?: string;
  navView: NavView;
  startMonth?: Date;
  endMonth?: Date;
  displayYears: { from: number; to: number };
  setDisplayYears: Dispatch<SetStateAction<{ from: number; to: number }>>;
}

const Nav: FC<NavProps> = ({
  className,
  navView,
  startMonth,
  endMonth,
  displayYears,
  setDisplayYears,
}) => {
  const { nextMonth, previousMonth, goToMonth } = useDayPicker();

  const isPreviousDisabled = (() => {
    if (navView === "years") {
      return (
        (startMonth &&
          differenceInCalendarDays(
            new Date(displayYears.from - 1, 0, 1),
            startMonth,
          ) < 0) ||
        (endMonth &&
          differenceInCalendarDays(
            new Date(displayYears.from - 1, 0, 1),
            endMonth,
          ) > 0)
      );
    }
    return !previousMonth;
  })();

  const isNextDisabled = (() => {
    if (navView === "years") {
      return (
        (startMonth &&
          differenceInCalendarDays(
            new Date(displayYears.to + 1, 0, 1),
            startMonth,
          ) < 0) ||
        (endMonth &&
          differenceInCalendarDays(
            new Date(displayYears.to + 1, 0, 1),
            endMonth,
          ) > 0)
      );
    }
    return !nextMonth;
  })();

  const handlePreviousClick = useCallback(() => {
    if (!previousMonth) {
      return;
    }

    if (navView === "years") {
      setDisplayYears((prev) => ({
        from: prev.from - (prev.to - prev.from + 1),
        to: prev.to - (prev.to - prev.from + 1),
      }));

      return;
    }

    goToMonth(previousMonth);
  }, [previousMonth, navView, goToMonth, setDisplayYears]);

  const handleNextClick = useCallback(() => {
    if (!nextMonth) {
      return;
    }

    if (navView === "years") {
      setDisplayYears((prev) => ({
        from: prev.from + (prev.to - prev.from + 1),
        to: prev.to + (prev.to - prev.from + 1),
      }));

      return;
    }

    goToMonth(nextMonth);
  }, [goToMonth, navView, nextMonth, setDisplayYears]);

  return (
    <nav className={cn("flex items-center", className)}>
      <Button
        variant="ghost"
        className="absolute left-0 h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100"
        type="button"
        tabIndex={isPreviousDisabled ? undefined : -1}
        disabled={isPreviousDisabled}
        aria-label={
          navView === "years"
            ? `Go to the previous ${
                displayYears.to - displayYears.from + 1
              } years`
            : labelPrevious(previousMonth)
        }
        onClick={handlePreviousClick}
      >
        <IconArrowLeft className="size-4" />
      </Button>

      <Button
        variant="ghost"
        className="absolute right-0 h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100"
        type="button"
        tabIndex={isNextDisabled ? undefined : -1}
        disabled={isNextDisabled}
        aria-label={
          navView === "years"
            ? `Go to the next ${displayYears.to - displayYears.from + 1} years`
            : labelNext(nextMonth)
        }
        onClick={handleNextClick}
      >
        <IconArrowRight className="size-4" />
      </Button>
    </nav>
  );
};

interface CaptionLabelProps {
  showYearSwitcher?: boolean;
  navView: NavView;
  setNavView: Dispatch<SetStateAction<NavView>>;
  displayYears: { from: number; to: number };
  children?: ReactNode;
}

const CaptionLabel: FC<CaptionLabelProps> = ({
  showYearSwitcher,
  navView,
  setNavView,
  displayYears,
  children,
  ...props
}) => {
  if (!showYearSwitcher) {
    return <span {...props}>{children}</span>;
  }

  return (
    <Button
      className="h-7 w-full truncate rounded-md text-sm font-medium"
      variant="ghost"
      size="sm"
      onClick={() => setNavView((prev) => (prev === "days" ? "years" : "days"))}
    >
      {navView === "days"
        ? children
        : `${displayYears.from} - ${displayYears.to}`}
    </Button>
  );
};

interface MonthGridProps {
  displayYears: { from: number; to: number };
  startMonth?: Date;
  endMonth?: Date;
  navView: NavView;
  setNavView: Dispatch<SetStateAction<NavView>>;
  className?: string;
  children?: ReactNode;
}

const MonthGrid: FC<MonthGridProps> = ({
  displayYears,
  startMonth,
  endMonth,
  navView,
  setNavView,
  ...props
}) => {
  if (navView === "years") {
    return (
      <YearGrid
        displayYears={displayYears}
        startMonth={startMonth}
        endMonth={endMonth}
        setNavView={setNavView}
        navView={navView}
        {...props}
      />
    );
  }

  return <table {...props} />;
};

interface YearGridProps {
  className?: string;
  displayYears: { from: number; to: number };
  startMonth?: Date;
  endMonth?: Date;
  setNavView: React.Dispatch<React.SetStateAction<NavView>>;
  navView: NavView;
}

const YearGrid: FC<YearGridProps> = ({
  displayYears,
  startMonth,
  endMonth,
  setNavView,
  navView,
  className,
  ...props
}) => {
  const { goToMonth, selected } = useDayPicker();

  return (
    <div className={cn("grid grid-cols-4 gap-y-2", className)} {...props}>
      {Array.from(
        { length: displayYears.to - displayYears.from + 1 },
        (_, i) => {
          const isBefore =
            differenceInCalendarDays(
              new Date(displayYears.from + i, 11, 31),
              startMonth!,
            ) < 0;

          const isAfter =
            differenceInCalendarDays(
              new Date(displayYears.from + i, 0, 0),
              endMonth!,
            ) > 0;

          const isDisabled = isBefore || isAfter;

          return (
            <Button
              key={i}
              className={cn(
                "text-foreground h-7 w-full rounded-md text-sm font-normal",
                displayYears.from + i === new Date().getFullYear() &&
                  "bg-accent text-accent-foreground font-medium",
              )}
              variant="ghost"
              onClick={() => {
                setNavView("days");
                goToMonth(
                  new Date(
                    displayYears.from + i,
                    (selected as Date | undefined)?.getMonth() ?? 0,
                  ),
                );
              }}
              disabled={navView === "years" ? isDisabled : undefined}
            >
              {displayYears.from + i}
            </Button>
          );
        },
      )}
    </div>
  );
};

function differenceInCalendarDays(dateLeft: Date, dateRight: Date) {
  const start = new Date(dateLeft);
  const end = new Date(dateRight);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}
