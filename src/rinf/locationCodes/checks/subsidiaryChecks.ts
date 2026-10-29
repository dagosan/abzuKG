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
import { normalisePrimaryCode, subsidiaryKey } from "../model/codeFormat";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { isActiveOn } from "../model/RegisteredCode";
import { findSubsidiaryType } from "../model/subsidiaryTypes";
import { assignableCode } from "./assignableCode";
import {
  activeSubsidiariesOf,
  checkResult as result,
  CheckContext,
  findRegistered,
  subsidiaryValuesOf,
} from "./checkContext";

const NOT_APPLICABLE = "rinf_lc_detail_not_applicable";

const sameName = (first: string, second: string) =>
  first.trim().toLowerCase() === second.trim().toLowerCase();

/** Item 6: no active SLC of the same type and name under the parent. */
export const subsidiaryDuplicateCheck = (
  { data }: LocationCodeRequest,
  context: CheckContext,
): CheckResult => {
  if (!isCreation(data.operation))
    return result("noDuplicate", "notApplicable", NOT_APPLICABLE);
  const parent = normalisePrimaryCode(data.parentPrimaryCode);
  const twin = activeSubsidiariesOf(
    context.register,
    parent,
    context.today,
  ).find(
    (code) =>
      code.subsidiaryTypeCode === data.subsidiaryTypeCode &&
      sameName(code.name, data.locationName),
  );
  return twin
    ? result("noDuplicate", "warning", "rinf_lc_detail_possible_twin", {
        code: twin.code,
      })
    : result("noDuplicate", "pass", "rinf_lc_detail_no_duplicate");
};

/** Item 7: an active parent PLC exists; the type code is in Table 6. */
export const parentCheck = (
  { data }: LocationCodeRequest,
  context: CheckContext,
): CheckResult => {
  const parent = normalisePrimaryCode(data.parentPrimaryCode);
  if (
    isCreation(data.operation) &&
    !findSubsidiaryType(data.subsidiaryTypeCode)
  )
    return result("parentPrimaryCode", "fail", "rinf_lc_detail_type_unknown");
  const registered = findRegistered(context.register, parent);
  if (registered && !isActiveOn(registered, context.today))
    return result("parentPrimaryCode", "fail", "rinf_lc_detail_parent_closed", {
      code: parent,
    });
  if (!registered && !context.kgPrimaryCode)
    return result(
      "parentPrimaryCode",
      "fail",
      "rinf_lc_detail_parent_unknown",
      {
        code: parent,
      },
    );
  return result("parentPrimaryCode", "pass", "rinf_lc_detail_parent_found", {
    code: parent,
  });
};

/** Item 10: the proposed value is free under the parent, or the target exists. */
export const subsidiaryValueCheck = (
  request: LocationCodeRequest,
  context: CheckContext,
): CheckResult => {
  const { data } = request;
  const parent = normalisePrimaryCode(data.parentPrimaryCode);
  const used = subsidiaryValuesOf(context, parent);
  if (!isCreation(data.operation)) {
    const target = data.targetCode.trim();
    const registered = findRegistered(
      context.register,
      subsidiaryKey(parent, target),
    );
    if (registered && !isActiveOn(registered, context.today))
      return result("codeValueFree", "fail", "rinf_lc_detail_target_closed", {
        code: target,
      });
    return used.includes(target)
      ? result("codeValueFree", "pass", "rinf_lc_detail_target_found", {
          code: target,
        })
      : result("codeValueFree", "fail", "rinf_lc_detail_target_unknown", {
          code: target,
        });
  }
  const proposed = data.proposedCode.trim();
  const assignable = assignableCode(request, context);
  if (!proposed && assignable)
    return result("codeValueFree", "pass", "rinf_lc_detail_will_assign", {
      code: assignable,
    });
  if (!used.includes(proposed))
    return result("codeValueFree", "pass", "rinf_lc_detail_proposed_free", {
      code: proposed,
    });
  return data.operation === "newCode" && assignable
    ? result("codeValueFree", "warning", "rinf_lc_detail_proposed_taken", {
        code: proposed,
        alternative: assignable,
      })
    : result("codeValueFree", "fail", "rinf_lc_detail_already_registered", {
        code: proposed,
      });
};
