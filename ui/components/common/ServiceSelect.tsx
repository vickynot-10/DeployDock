"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useGetServices } from "@/hooks/queries/useCommon";

export type ServiceOption = {
  id: string;
  name: string;
  type: string;
  deploy_type: number;
};

const empty: never[] = [];
export function ServiceSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { data: servicesData, isLoading } = useGetServices();

  const services: ServiceOption[] = servicesData?.data ?? empty;
  const [open, setOpen] = React.useState(false);
  const selected = services.find((service) => service.id === value);

  function handleSelect(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isLoading}
            className="w-60 justify-between font-normal"
          />
        }
      >
        <span className="truncate">{selected?.name ?? "All services"}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search services" />
          <CommandList>
            <CommandEmpty>No service found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all-services"
                keywords={["all"]}
                onSelect={() => handleSelect(null)}
              >
                <Check
                  className={cn(
                    "size-4",
                    value === null ? "opacity-100" : "opacity-0",
                  )}
                />
                All services
              </CommandItem>
              {services.map((service) => (
                <CommandItem
                  key={service.id}
                  value={service.id}
                  keywords={[service.name]}
                  onSelect={() => handleSelect(service.id)}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === service.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{service.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {service.type}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
