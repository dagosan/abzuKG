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
import { normalisePrimaryCode } from "../model/codeFormat";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { isActiveOn } from "../model/RegisteredCode";
import {
  checkResult as result,
  CheckContext,
  findRegistered,
} from "./checkContext";

/** First population: the code may already be in the KG for the same OP. */
export const existingCodeCheck = (
  { data }: LocationCodeRequest,
  context: CheckContext,
  proposed: string,
): CheckResult => {
  if (findRegistered(context.register, proposed))
    return result(
      "codeValueFree",
      "fail",
      "rinf_lc_detail_already_registered",
      { code: proposed },
    );
  const inKg = context.kgProposedCode;
  if (!inKg)
    return result("codeValueFree", "pass", "rinf_lc_detail_proposed_free", {
      code: proposed,
    });
  const sameElement = inKg.operationalPoints.includes(
    data.rinfLink?.canonicalId ?? "",
  );
  return sameElement
    ? result("codeValueFree", "warning", "rinf_lc_detail_already_in_kg", {
        code: proposed,
      })
    : result("codeValueFree", "fail", "rinf_lc_detail_used_elsewhere", {
        code: proposed,
        elements: inKg.operationalPoints.join(", ") || "—",
      });
};

/** Amendment or deactivation: the code exists and is not closed. */
export const primaryTargetCheck = (
  { data }: LocationCodeRequest,
  context: CheckContext,
): CheckResult => {
  const target = normalisePrimaryCode(data.targetCode);
  const registered = findRegistered(context.register, target);
  if (registered && !isActiveOn(registered, context.today))
    return result("codeValueFree", "fail", "rinf_lc_detail_target_closed", {
      code: target,
    });
  if (!registered && !context.kgPrimaryCode)
    return result("codeValueFree", "fail", "rinf_lc_detail_target_unknown", {
      code: target,
    });
  return result("codeValueFree", "pass", "rinf_lc_detail_target_found", {
    code: target,
  });
};
