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

Added for the ERA Location Code Manager, 2026-11-10. */

import { parsePrimaryCode } from "./codeFormat";
import type { RequestData } from "./LocationCodeRequest";

/**
 * The country a request concerns. The form asks for it only when a PLC is
 * created; otherwise it is the prefix of the PLC concerned: the parent of an
 * SLC, or the PLC to amend or deactivate. Blank when neither is given.
 */
export const countryOfRequest = (data: RequestData): string => {
  if (data.country) return data.country;
  const primaryCode =
    data.codeType === "subsidiary" ? data.parentPrimaryCode : data.targetCode;
  return parsePrimaryCode(primaryCode)?.country ?? "";
};
