"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  name: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  options: SearchableSelectOption[];
};

export function SearchableSelect({
  name,
  defaultValue,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Selecione",
  searchPlaceholder = "Digite para filtrar...",
  emptyLabel = "Nenhum resultado",
  options
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [options, search]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Select
      name={name}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) setSearch("");
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className="w-[var(--radix-select-trigger-width)]"
        position="popper"
        sideOffset={4}
        onKeyDownCapture={(event) => event.stopPropagation()}
        onKeyUpCapture={(event) => event.stopPropagation()}
      >
        <div className="p-1">
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            onKeyDownCapture={(event) => event.stopPropagation()}
            onKeyUp={(event) => event.stopPropagation()}
            onKeyUpCapture={(event) => event.stopPropagation()}
            onBlur={() => {
              setTimeout(() => {
                if (openRef.current) searchInputRef.current?.focus();
              }, 0);
            }}
            placeholder={searchPlaceholder}
          />
        </div>
        {filteredOptions.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
