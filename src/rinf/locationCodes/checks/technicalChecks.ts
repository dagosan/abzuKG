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
import { isOfficialEuLanguage } from "../model/languages";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { isStakeholderCategory } from "../model/stakeholderCategories";
import { entitlementOf, findSubsidiaryType } from "../model/subsidiaryTypes";
import { admissibilityErrors } from "./admissibility";
import { checkResult as result, CheckContext } from "./checkContext";
import {
  dependentCodesCheck,
  primaryDuplicateCheck,
  primaryNetworkCheck,
  primaryValueCheck,
} from "./primaryChecks";
import {
  parentCheck,
  subsidiaryDuplicateCheck,
  subsidiaryPositionCheck,
  subsidiaryValueCheck,
} from "./subsidiaryChecks";

const NOT_APPLICABLE = "rinf_lc_detail_not_applicable";

/** Items 1 to 5: what the CAS checked on submission, recorded in the file. */
const admissibilityChecks = ({ data }: LocationCodeRequest): CheckResult[] => {
  const missing = Object.keys(admissibilityErrors(data)).length;
  return [
    result("channel", "pass", "rinf_lc_detail_channel"),
    missing === 0
      ? result("mandatoryElements", "pass", "rinf_lc_detail_complete")
      : result("mandatoryElements", "fail", "rinf_lc_detail_incomplete", {
          count: String(missing),
        }),
    isStakeholderCategory(data.requester.category)
      ? result("telematicsStakeholder", "pass", "rinf_lc_detail_stakeholder")
      : result(
          "telematicsStakeholder",
          "fail",
          "rinf_lc_detail_not_stakeholder",
        ),
    data.preSubmissionConfirmed
      ? result("preSubmissionCheck", "pass", "rinf_lc_detail_pre_check_done")
      : result(
          "preSubmissionCheck",
          "fail",
          "rinf_lc_detail_pre_check_missing",
        ),
    isOfficialEuLanguage(data.language)
      ? result("language", "pass", "rinf_lc_detail_language")
      : result("language", "fail", "rinf_lc_detail_language_not_official"),
  ];
};

/**
 * Who is consulted when the requester is not the responsible party (6.7):
 * the IM for a PLC, the party of Table 6 for an SLC. Never a rejection.
 */
const entitlementCheck = ({ data }: LocationCodeRequest): CheckResult => {
  const { category } = data.requester;
  if (!isStakeholderCategory(category))
    return result("entitledRequester", "notApplicable", NOT_APPLICABLE);
  if (data.codeType === "primary")
    return category === "infrastructureManager"
      ? result("entitledRequester", "pass", "rinf_lc_detail_requester_is_im")
      : result("entitledRequester", "manual", "rinf_lc_detail_consult_im", {
          im: data.imOrganisationCode || "—",
        });
  const type = findSubsidiaryType(data.subsidiaryTypeCode);
  if (!type || !isCreation(data.operation))
    return result(
      "entitledRequester",
      "manual",
      "rinf_lc_detail_consult_originator",
    );
  const outcome = entitlementOf(type, category);
  if (outcome === "entitled")
    return result("entitledRequester", "pass", "rinf_lc_detail_entitled");
  return result(
    "entitledRequester",
    "manual",
    outcome === "consult"
      ? "rinf_lc_detail_consult_party"
      : "rinf_lc_detail_confirm_owner",
    { type: `${type.code} ${type.name}`, parties: type.entitled.join(", ") },
  );
};

/** The checks of steps 2 and 4 (Annex A items 1–11) for one request. */
export const runTechnicalChecks = (
  request: LocationCodeRequest,
  context: CheckContext,
): CheckResult[] => {
  const { data } = request;
  const isPrimary = data.codeType === "primary";
  const changesData = data.operation !== "deactivation";
  return [
    ...admissibilityChecks(request),
    isPrimary
      ? primaryDuplicateCheck(request, context)
      : subsidiaryDuplicateCheck(request, context),
    isPrimary
      ? result("parentPrimaryCode", "notApplicable", NOT_APPLICABLE)
      : parentCheck(request, context),
    isPrimary
      ? primaryNetworkCheck(request, context)
      : subsidiaryPositionCheck(request, context),
    isPrimary && isCreation(data.operation)
      ? result("retailDoublet", "manual", "rinf_lc_detail_retail_manual")
      : result("retailDoublet", "notApplicable", NOT_APPLICABLE),
    isPrimary
      ? primaryValueCheck(request, context)
      : subsidiaryValueCheck(request, context),
    changesData
      ? result("dataQuality", "manual", "rinf_lc_detail_data_quality")
      : result("dataQuality", "notApplicable", NOT_APPLICABLE),
    entitlementCheck(request),
    isPrimary
      ? dependentCodesCheck(request, context)
      : result("dependentCodes", "notApplicable", NOT_APPLICABLE),
  ];
};
