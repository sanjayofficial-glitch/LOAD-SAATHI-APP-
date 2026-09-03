import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { filterVehicles, isKnownVehicle } from '@/data/vehicles';

interface VehicleSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface FlatItem {
  brand: string;
  vehicle: string;
}

/**
 * Searchable dropdown for Indian commercial vehicles.
 * Tap to open → search or scroll → select. No typing required.
 * Legacy values not in the catalog (e.g. "22ft") are kept selectable.
 */
export default function VehicleSelect({
  id,
  value,
  onChange,
  placeholder = 'Select Vehicle',
  className,
  disabled,
}: VehicleSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const groups = useMemo(() => filterVehicles(query), [query]);

  const items = useMemo<FlatItem[]>(() => {
    const list: FlatItem[] = [];
    if (value && !isKnownVehicle(value)) {
      list.push({ brand: 'Current selection', vehicle: value });
    }
    for (const group of groups) {
      for (const vehicle of group.vehicles) {
        list.push({ brand: group.brand, vehicle });
      }
    }
    return list;
  }, [groups, value]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Keep the keyboard-highlighted item in view while scrolling.
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[Math.max(activeIndex, 0)];
      if (!item) return;
      onChange(item.vehicle);
      setOpen(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            value ? 'text-foreground' : 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <div className="relative border-b p-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-activedescendant={activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search vehicle or brand…"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-14 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <div ref={listRef} id={listboxId} role="listbox" className="max-h-72 overflow-y-auto p-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Truck className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No vehicles found for “{query}”
                </p>
              </div>
            ) : (
              items.map((item, index) => {
                const isActive = index === activeIndex;
                const isSelected = item.vehicle === value;
                const isFirstInGroup = index === 0 || items[index - 1]?.brand !== item.brand;
                return (
                  <div key={`${item.brand}-${item.vehicle}`}>
                    {isFirstInGroup && (
                      <div className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {item.brand}
                      </div>
                    )}
                    <button
                      type="button"
                      id={`${listboxId}-item-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive || undefined}
                      onClick={() => {
                        onChange(item.vehicle);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                        isActive && 'bg-accent text-accent-foreground',
                        isSelected && !isActive && 'bg-accent/50',
                      )}
                    >
                      <span className="truncate">{item.vehicle}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
