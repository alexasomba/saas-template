import { getCachedGlobal } from "@/utilities/getGlobals";

import "./index.css";
import { HeaderClient } from "./index.client";

export async function Header() {
  const header = await getCachedGlobal("header", 1)();

  // @ts-expect-error
  return <HeaderClient header={header || { navItems: [] }} />;
}
