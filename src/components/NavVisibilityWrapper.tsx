"use client";

import { usePathname } from "next/navigation";
import React from "react";

export default function NavVisibilityWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide navigation on study routes
  const isStudyRoute = pathname.includes("/study");

  if (isStudyRoute) {
    return null;
  }

  return <>{children}</>;
}
