'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

export default function NProgressBar() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.start();
    NProgress.done();
  }, [pathname]);

  return null;
}