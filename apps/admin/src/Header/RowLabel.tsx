"use client";

import React from "react";
import type { Header as HeaderGlobal } from "@/payload-types";
import type { RowLabelProps } from "@payloadcms/ui";
import { useRowLabel } from "@payloadcms/ui";

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<HeaderGlobal["navItems"]>[number]>();

  const label = data?.data?.link?.label
    ? `Nav item ${data.rowNumber !== undefined ? data.rowNumber + 1 : ""}: ${data?.data?.link?.label}`
    : "Row";

  return <div>{label}</div>;
};
