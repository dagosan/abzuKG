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

import { isCreation } from "../model/codeTypes";
import {
  formatPrimaryCode,
  lowestFreeNumber,
  lowestFreeSubsidiaryCode,
  normalisePrimaryCode,
  parsePrimaryCode,
} from "../model/codeFormat";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import {
  CheckContext,
  registeredPrimaryCodes,
  subsidiaryValuesOf,
} from "./checkContext";

/** Values other open requests propose, so two requests cannot take one value. */
const reservedValues = (context: CheckContext): string[] =>
  context.otherOpenRequests.map((request) =>
    normalisePrimaryCode(request.assignableCode ?? request.data.proposedCode),
  );

/** Every primary code of the country in use: KG, register and reserved. */
export const usedPrimaryCodes = (
  context: CheckContext,
  country: string,
): Set<string> =>
  new Set(
    [
      ...context.kgCountryCodes,
      ...registeredPrimaryCodes(context.register).map((code) => code.code),
      ...reservedValues(context),
    ].filter((code) => code.startsWith(country)),
  );

const usedLocationNumbers = (used: Set<string>): Set<number> =>
  new Set(
    [...used]
      .map((code) => parsePrimaryCode(code)?.locationNumber)
      .filter((number): number is number => number !== undefined),
  );

/**
 * The value a positive decision would assign (procedure 8.7): the proposed
 * one when free, otherwise the lowest free one; for a change, the target.
 * Null when no value is available.
 */
export const assignableCode = (
  request: LocationCodeRequest,
  context: CheckContext,
): string | null => {
  const { data } = request;
  if (!isCreation(data.operation)) return data.targetCode.trim() || null;
  if (data.codeType === "subsidiary") {
    const used = subsidiaryValuesOf(
      context,
      normalisePrimaryCode(data.parentPrimaryCode),
    );
    const proposed = data.proposedCode.trim();
    if (proposed && !used.includes(proposed)) return proposed;
    return data.operation === "newCode" ? lowestFreeSubsidiaryCode(used) : null;
  }
  const used = usedPrimaryCodes(context, data.country);
  const proposed = normalisePrimaryCode(data.proposedCode);
  if (proposed && !used.has(proposed)) return proposed;
  if (data.operation === "existingCode") return proposed || null;
  const free = lowestFreeNumber(usedLocationNumbers(used));
  return free === null ? null : formatPrimaryCode(data.country, free);
};
