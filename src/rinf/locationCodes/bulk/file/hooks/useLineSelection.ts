/*
 *  Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

  https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence.

Added for the ERA Location Code Manager, 2026-11-14. */

import { useCallback, useMemo, useState } from "react";
import type { LocationCodeRequest } from "../../../model/LocationCodeRequest";

export interface LineSelection {
  /** The lines ticked, in the order of the file. */
  selected: LocationCodeRequest[];
  isSelected: (lineId: string) => boolean;
  toggle: (lineId: string) => void;
  allSelected: boolean;
  /** Ticks every line, or unticks them all when all are ticked. */
  toggleAll: () => void;
}

/** The lines of a bulk request ticked for a step. The ticks stay after a step, for the next one. */
export const useLineSelection = (
  lines: LocationCodeRequest[],
): LineSelection => {
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());
  const selected = useMemo(
    () => lines.filter((line) => ids.has(line.id)),
    [lines, ids],
  );
  const allSelected = lines.length > 0 && selected.length === lines.length;

  const isSelected = useCallback((lineId: string) => ids.has(lineId), [ids]);
  const toggle = useCallback(
    (lineId: string) =>
      setIds((current) => {
        const next = new Set(current);
        if (!next.delete(lineId)) next.add(lineId);
        return next;
      }),
    [],
  );
  const toggleAll = useCallback(
    () => setIds(allSelected ? new Set() : new Set(lines.map(({ id }) => id))),
    [allSelected, lines],
  );

  return { selected, isSelected, toggle, allSelected, toggleAll };
};
