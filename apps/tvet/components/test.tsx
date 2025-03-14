"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import React, { useState, type FC, type ReactNode } from "react";

export interface TestProps {
  activePage: number;
  children?: ReactNode;
}

export const Test: FC<TestProps> = ({ children, activePage }) => {
  const childArray = React.Children.toArray(children);

  const Prev = React.isValidElement(
    childArray[activePage - 1 < 0 ? 0 : activePage - 1],
  )
    ? React.cloneElement(
        childArray[
          activePage - 1 < 0 ? 0 : activePage - 1
        ] as React.ReactElement,
        undefined,
        <IconArrowLeft />,
      )
    : null;

  const Next = React.isValidElement(
    childArray[activePage < childArray.length ? activePage + 1 : activePage],
  )
    ? React.cloneElement(
        childArray[
          activePage < childArray.length ? activePage + 1 : activePage
        ] as React.ReactElement,
        undefined,
        <IconArrowRight />,
      )
    : null;

  return (
    <div>
      <div>{Prev}</div>
      {childArray.map((child, index) => {
        return (
          <div
            key={index}
            className={activePage == index ? "bg-amber-600" : undefined}
          >
            {child}
          </div>
        );
      })}
      <div>{Next}</div>
    </div>
  );
};
