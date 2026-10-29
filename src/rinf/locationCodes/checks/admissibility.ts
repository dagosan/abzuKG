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
import { isValidSubsidiaryCode, parsePrimaryCode } from "../model/codeFormat";
import { isCountryPrefix } from "../model/countries";
import { isOfficialEuLanguage } from "../model/languages";
import type { RequestData } from "../model/LocationCodeRequest";
import { isStakeholderCategory } from "../model/stakeholderCategories";
import { findSubsidiaryType } from "../model/subsidiaryTypes";

/** Form fields that can be in error. */
export type RequestField =
  | "requesterName"
  | "organisation"
  | "organisationCode"
  | "category"
  | "email"
  | "language"
  | "preSubmissionConfirmed"
  | "country"
  | "proposedCode"
  | "targetCode"
  | "locationName"
  | "imOrganisationCode"
  | "rinfLink"
  | "parentPrimaryCode"
  | "subsidiaryTypeCode"
  | "effectiveDate"
  | "justification";

/** Text key of each field's error. */
export type AdmissibilityErrors = Partial<Record<RequestField, string>>;

const ORGANISATION_CODE_PATTERN = /^[A-Za-z0-9]{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED = "rinf_lc_error_required";

const isBlank = (value: string) => value.trim() === "";

const requesterErrors = ({
  requester,
  language,
  preSubmissionConfirmed,
}: RequestData): AdmissibilityErrors => ({
  ...(isBlank(requester.name) && { requesterName: REQUIRED }),
  ...(isBlank(requester.organisation) && { organisation: REQUIRED }),
  ...(!ORGANISATION_CODE_PATTERN.test(requester.organisationCode) && {
    organisationCode: "rinf_lc_error_organisation_code",
  }),
  ...(!isStakeholderCategory(requester.category) && { category: REQUIRED }),
  ...(!EMAIL_PATTERN.test(requester.email) && {
    email: "rinf_lc_error_email",
  }),
  ...(!isOfficialEuLanguage(language) && {
    language: "rinf_lc_error_language",
  }),
  ...(!preSubmissionConfirmed && { preSubmissionConfirmed: REQUIRED }),
});

const primaryErrors = (data: RequestData): AdmissibilityErrors => {
  const creating = isCreation(data.operation);
  const proposed = parsePrimaryCode(data.proposedCode);
  const target = parsePrimaryCode(data.targetCode);
  return {
    ...(creating && !isCountryPrefix(data.country) && { country: REQUIRED }),
    ...(creating &&
      !isBlank(data.proposedCode) &&
      (!proposed || proposed.country !== data.country) && {
        proposedCode: "rinf_lc_error_primary_code",
      }),
    ...(data.operation === "existingCode" &&
      isBlank(data.proposedCode) && { proposedCode: REQUIRED }),
    ...(!creating && !target && { targetCode: "rinf_lc_error_primary_code" }),
    ...(creating && isBlank(data.locationName) && { locationName: REQUIRED }),
    ...(creating &&
      !ORGANISATION_CODE_PATTERN.test(data.imOrganisationCode) && {
        imOrganisationCode: "rinf_lc_error_organisation_code",
      }),
    ...(creating && !data.rinfLink && { rinfLink: REQUIRED }),
  };
};

const subsidiaryErrors = (data: RequestData): AdmissibilityErrors => {
  const creating = isCreation(data.operation);
  const codeField = creating ? data.proposedCode : data.targetCode;
  const codeRequired = data.operation !== "newCode";
  return {
    ...(!parsePrimaryCode(data.parentPrimaryCode) && {
      parentPrimaryCode: "rinf_lc_error_primary_code",
    }),
    ...(creating &&
      !findSubsidiaryType(data.subsidiaryTypeCode) && {
        subsidiaryTypeCode: REQUIRED,
      }),
    ...(creating && isBlank(data.locationName) && { locationName: REQUIRED }),
    ...(codeRequired &&
      isBlank(codeField) && {
        [creating ? "proposedCode" : "targetCode"]: REQUIRED,
      }),
    ...(!isBlank(codeField) &&
      !isValidSubsidiaryCode(codeField) && {
        [creating ? "proposedCode" : "targetCode"]:
          "rinf_lc_error_subsidiary_code",
      }),
  };
};

const changeErrors = (data: RequestData): AdmissibilityErrors => {
  if (isCreation(data.operation)) return {};
  return {
    ...(isBlank(data.effectiveDate) && { effectiveDate: REQUIRED }),
    ...(data.operation === "deactivation" &&
      isBlank(data.justification) && { justification: REQUIRED }),
    ...(data.operation === "amendment" &&
      isBlank(data.locationName) &&
      isBlank(data.imOrganisationCode) &&
      !data.rinfLink && { locationName: "rinf_lc_error_nothing_to_amend" }),
  };
};

/**
 * The automated admissibility check run on submission (procedure 8.3, Annex
 * A items 2, 3 and 5): every mandatory element present and well formed.
 */
export const admissibilityErrors = (
  data: RequestData,
): AdmissibilityErrors => ({
  ...requesterErrors(data),
  ...(data.codeType === "primary"
    ? primaryErrors(data)
    : subsidiaryErrors(data)),
  ...changeErrors(data),
});

export const isAdmissible = (data: RequestData): boolean =>
  Object.keys(admissibilityErrors(data)).length === 0;
