"use client";

import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import SearchCommand from "@/components/SearchCommand"; // adjust path

const NavItems = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          {/* ⭐ Special case for search */}
          {item.href === "/search" ? (
            <SearchCommand renderAs="text" label="Search" initialStocks={[]} />
          ) : (
            <Link
              href={item.href}
              className={`transition-colors text-gray-400 hover:text-red-500 ${
                isActive(item.href) ? "text-red-500 font-semibold" : ""
              }`}
            >
              {item.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
};

export default NavItems;
