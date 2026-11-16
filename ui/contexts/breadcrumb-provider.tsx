"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BreadcrumbEntry = {
  label: string;
  href?: string;
};

type BreadcrumbContextValue = {
  items: BreadcrumbEntry[] | null;
  setItems: (items: BreadcrumbEntry[] | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<BreadcrumbEntry[] | null>(null);

  const value = useMemo(() => ({ items, setItems }), [items]);

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumbs must be used inside BreadcrumbProvider");
  }
  return context;
}

export function useBreadcrumbItems(items: BreadcrumbEntry[] | null) {
  const { setItems } = useBreadcrumbs();
  const serializedItems = items ? JSON.stringify(items) : null;

  useEffect(() => {
    if (!serializedItems) return;
    setItems(JSON.parse(serializedItems));
    return () => setItems(null);
  }, [serializedItems, setItems]);
}

export function BreadcrumbItems({ items }: { items: BreadcrumbEntry[] }) {
  useBreadcrumbItems(items);
  return null;
}
