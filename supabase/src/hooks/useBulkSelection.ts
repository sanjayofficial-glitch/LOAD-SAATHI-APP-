import { useState, useCallback } from 'react';

export function useBulkSelection<T extends { id: string }>() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((items: T[]) => {
    setSelected(new Set(items.map(i => i.id)));
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  return { selected, toggle, selectAll, clear, count: selected.size };
}
