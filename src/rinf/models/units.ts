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

Added for the ERA RINF frontend, 2026-10-28. */

import { localName } from "./labels";

/** Symbols for the QUDT units the ERA vocabulary uses (all 13 as of 2026-10-28). */
const UNIT_SYMBOLS: Record<string, string> = {
  M: "m",
  MilliM: "mm",
  KiloM: "km",
  "KiloM-PER-HR": "km/h",
  SEC: "s",
  A: "A",
  "A-PER-M": "A/m",
  "MilliM-PER-M": "mm/m",
  V: "V",
  "M-PER-SEC2": "m/s²",
  N: "N",
  M2: "m²",
  OHM: "Ω",
};

/** Display symbol for a QUDT unit URI; the QUDT code itself if unknown. */
export const unitSymbol = (unitUri: string): string => {
  const code = localName(unitUri);
  return UNIT_SYMBOLS[code] ?? code;
};
