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

import type { CheckResult } from "../model/checklist";
import { isCreation } from "../model/codeTypes";
import { normalisePrimaryCode } from "../model/codeFormat";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { isActiveOn } from "../model/RegisteredCode";
import { assignableCode, usedPrimaryCodes } from "./assignableCode";
import { existingCodeCheck, primaryTargetCheck } from "./primaryValueChecks";
import {
  activeSubsidiariesOf,
  checkResult as result,
  CheckContext,
  findRegistered,
  registeredPrimaryCodes,
  sameLink,
} from "./checkContext";

/**
 * Item 6: no PLC already covers the same location. An OP or section of line
 * may hold several locations, each with its own PLC (Lyon-Part-Dieu has
 * three), so codes already on the element are listed for the code
 * administrator; only one with the same name is flagged.
 */
export const primaryDuplicateCheck = (
  { data }: LocationCodeRequest,
  context: CheckContext,
): CheckResult => {
  if (data.operation === "deactivation" || !data.rinfLink)
    return result(
      "noDuplicate",
      "notApplicable",
      "rinf_lc_detail_not_applicable",
    );
  const ownCode = normalisePrimaryCode(
    isCreation(data.operation) ? data.proposedCode : data.targetCode,
  );
  const names = context.rinfElement?.codeNames ?? {};
  const onElement = [
    ...(context.rinfElement?.codes ?? []).map((code) => ({
      code,
      name: names[code] ?? "",
    })),
    ...registeredPrimaryCodes(context.register)
      .filter(
        (code) =>
          isActiveOn(code, context.today) &&
          sameLink(code.rinfLink, data.rinfLink),
      )
      .map(({ code, name }) => ({ code, name })),
  ].filter(({ code }) => code !== ownCode);
  if (onElement.length === 0)
    return result("noDuplicate", "pass", "rinf_lc_detail_no_duplicate");
  const listed = onElement
    .map(({ code, name }) => (name ? `${code} ${name}` : code))
    .join(", ");
  const sameName = onElement.find(
    ({ name }) =>
      name !== "" &&
      name.trim().toLowerCase() === data.locationName.trim().toLowerCase(),
  );
  return sameName
    ? result("noDuplicate", "warning", "rinf_lc_detail_same_name", {
        code: sameName.code,
        codes: listed,
      })
    : result("noDuplicate", "pass", "rinf_lc_detail_other_locations", {
        codes: listed,
      });
};

/** Item 8: on an IM network (in RINF today), no competing request. */
export const primaryNetworkCheck = (
  request: LocationCodeRequest,
  context: CheckContext,
): CheckResult => {
  const { data } = request;
  if (data.operation === "deactivation" || !data.rinfLink)
    return result(
      "onNetworkNoCompetition",
      "notApplicable",
      "rinf_lc_detail_not_applicable",
    );
  const competing = context.otherOpenRequests.find((other) =>
    sameLink(other.data.rinfLink, data.rinfLink),
  );
  if (competing)
    // Several locations of one OP may be coded at once: a warning to look.
    return result(
      "onNetworkNoCompetition",
      "warning",
      "rinf_lc_detail_competing",
      {
        reference: competing.reference ?? competing.id,
      },
    );
  const element = context.rinfElement;
  if (!element?.exists)
    return result(
      "onNetworkNoCompetition",
      "fail",
      "rinf_lc_detail_not_in_rinf",
    );
  if (!element.validToday)
    return result(
      "onNetworkNoCompetition",
      "warning",
      "rinf_lc_detail_not_valid_today",
    );
  return result("onNetworkNoCompetition", "pass", "rinf_lc_detail_in_rinf", {
    label: element.label ?? data.rinfLink.canonicalId,
  });
};

/** Item 10: the proposed value is free, or the target code exists. */
export const primaryValueCheck = (
  request: LocationCodeRequest,
  context: CheckContext,
): CheckResult => {
  const { data } = request;
  if (!isCreation(data.operation)) return primaryTargetCheck(request, context);
  const proposed = normalisePrimaryCode(data.proposedCode);
  const assignable = assignableCode(request, context);
  if (!assignable)
    return result("codeValueFree", "fail", "rinf_lc_detail_country_full");
  if (!proposed)
    return result("codeValueFree", "pass", "rinf_lc_detail_will_assign", {
      code: assignable,
    });
  if (data.operation === "existingCode")
    return existingCodeCheck(request, context, proposed);
  if (usedPrimaryCodes(context, data.country).has(proposed))
    return result("codeValueFree", "warning", "rinf_lc_detail_proposed_taken", {
      code: proposed,
      alternative: assignable,
    });
  return result("codeValueFree", "pass", "rinf_lc_detail_proposed_free", {
    code: proposed,
  });
};

/** Rule 6.2(a): a PLC is not closed while an active SLC depends on it. */
export const dependentCodesCheck = (
  { data }: LocationCodeRequest,
  context: CheckContext,
): CheckResult => {
  if (data.operation !== "deactivation")
    return result(
      "dependentCodes",
      "notApplicable",
      "rinf_lc_detail_not_applicable",
    );
  const target = normalisePrimaryCode(data.targetCode);
  const registered = activeSubsidiariesOf(
    context.register,
    target,
    context.today,
  );
  const count = new Set([
    ...registered.map((code) => code.code),
    ...context.kgSubsidiaryCodes,
  ]).size;
  if (count === 0)
    return result("dependentCodes", "pass", "rinf_lc_detail_no_dependants");
  return data.closeDependentCodes
    ? result("dependentCodes", "warning", "rinf_lc_detail_dependants_closed", {
        count: String(count),
      })
    : result("dependentCodes", "fail", "rinf_lc_detail_dependants_active", {
        count: String(count),
      });
};
