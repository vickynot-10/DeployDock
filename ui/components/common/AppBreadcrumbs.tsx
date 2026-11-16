"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type ItemsType = {
  label: string;
  href: string;
};

export interface BreadcrumbsInterface {
  items: ItemsType[];
}

export default function AppBreadcrumb({ items }: BreadcrumbsInterface) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((el, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={el.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{el.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={el.href} />}>
                    {el.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
