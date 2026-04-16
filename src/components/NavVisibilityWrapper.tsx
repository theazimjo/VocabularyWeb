"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

export default function NavVisibilityWrapper({
  children,
  type = "nav", // "nav" or "padding"
}: {
  children?: React.ReactNode;
  type?: "nav" | "padding";
}) {
  const pathname = usePathname();
  const isStudyRoute = pathname.includes("/study");

  useEffect(() => {
    if (isStudyRoute) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [isStudyRoute]);

  if (type === "padding") {
    return (
      <main className={`flex-1 ${isStudyRoute ? "" : "pb-20 sm:pb-0"}`}>
        {children}
      </main>
    );
  }

  if (isStudyRoute) {
    return null;
  }

  return <>{children}</>;
}
