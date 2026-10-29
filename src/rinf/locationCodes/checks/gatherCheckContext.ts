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
import { normalisePrimaryCode } from "../model/codeFormat";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";
import type { CheckContext } from "./checkContext";
import {
  fetchCountryCodes,
  fetchElement,
  fetchPrimaryLocation,
  fetchSubsidiaryCodes,
} from "./kgLookups";

const NOT_COMPETING = ["rejected", "closed"];

/** The PLC the KG is asked about: SLC parent, or PLC amended or closed. */
const primaryCodeConcerned = ({ data }: LocationCodeRequest): string | null => {
  if (data.codeType === "subsidiary")
    return normalisePrimaryCode(data.parentPrimaryCode);
  return isCreation(data.operation)
    ? null
    : normalisePrimaryCode(data.targetCode);
};

/**
 * Asks the Knowledge Graph what the checks need, in parallel (about 1–2 s),
 * and adds what this workflow has recorded itself.
 */
export const gatherCheckContext = async (
  endpoint: string,
  request: LocationCodeRequest,
  requests: LocationCodeRequest[],
  register: RegisteredCode[],
  today: string,
): Promise<CheckContext> => {
  const { data } = request;
  const isPrimaryCreation =
    data.codeType === "primary" && isCreation(data.operation);
  const proposed = normalisePrimaryCode(data.proposedCode);
  const concerned = primaryCodeConcerned(request);
  const needsSubsidiaries =
    data.codeType === "subsidiary" || data.operation === "deactivation";
  const [
    kgCountryCodes,
    kgProposedCode,
    kgPrimaryCode,
    kgSubsidiaryCodes,
    rinfElement,
  ] = await Promise.all([
    isPrimaryCreation ? fetchCountryCodes(endpoint, data.country) : [],
    isPrimaryCreation && proposed
      ? fetchPrimaryLocation(endpoint, proposed)
      : null,
    concerned ? fetchPrimaryLocation(endpoint, concerned) : null,
    concerned && needsSubsidiaries
      ? fetchSubsidiaryCodes(endpoint, concerned)
      : [],
    data.codeType === "primary" && data.rinfLink
      ? fetchElement(
          endpoint,
          data.rinfLink.kind,
          data.rinfLink.canonicalId,
          today,
        )
      : null,
  ]);
  return {
    today,
    kgCountryCodes,
    kgProposedCode,
    kgPrimaryCode,
    kgSubsidiaryCodes,
    rinfElement,
    register,
    otherOpenRequests: requests.filter(
      (other) =>
        other.id !== request.id && !NOT_COMPETING.includes(other.status),
    ),
  };
};
