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

Added for the ERA RINF frontend, 2026-10-29. */

import { useMemo } from "react";
import { useAppSelector } from "../../../store/hooks";
import type { DetailsKind } from "../../detailsKinds";
import { matchedIds } from "../../models/parameterMatches";

/**
 * Canonical ids of the places of `kind` matching the open parameter search,
 * or null when no search results are open (nothing to highlight).
 */
export const useMatchedIds = (kind: DetailsKind): string[] | null => {
  const { resultsKey, resultsStatus, places } = useAppSelector(
    (state) => state.rinf.parameterSearch,
  );
  const active = resultsKey !== null && resultsStatus === "loaded";
  return useMemo(
    () => (active ? matchedIds(places, kind) : null),
    [active, places, kind],
  );
};
