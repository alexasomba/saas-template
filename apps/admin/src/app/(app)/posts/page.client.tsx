"use client";
import { useHeaderTheme } from "@/providers/HeaderTheme";
import React, { useEffect } from "react";

const PageClient: React.FC = () => {
  /* Force the header to be light mode for the posts listing */
  const { setHeaderTheme } = useHeaderTheme();

  useEffect(() => {
    setHeaderTheme("light");
  }, [setHeaderTheme]);
  return <React.Fragment />;
};

export default PageClient;
