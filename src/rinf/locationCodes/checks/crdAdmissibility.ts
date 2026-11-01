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

Added for the ERA RINF frontend, 2026-11-02. */

import { isCreation } from "../model/codeTypes";
import { isAscii } from "../model/asciiName";
import {
  FREE_TEXT_MAX_LENGTH,
  isLatitude,
  isLongitude,
  isNutsCode,
} from "../model/crdValues";
import {
  CRD_FLAGS,
  CrdAttributes,
  crdOf,
  RequestData,
} from "../model/LocationCodeRequest";
import type { AdmissibilityErrors } from "./admissibility";

const REQUIRED = "rinf_lc_error_required";

const isBlank = (value: string) => value.trim() === "";

/** CRD's columns of a PLC: each well formed; the flags chosen for a new code. */
export const crdErrors = (data: RequestData): AdmissibilityErrors => {
  if (data.codeType !== "primary" || data.operation === "deactivation")
    return {};
  const crd = crdOf(data);
  const hasLatitude = !isBlank(crd.latitude);
  const hasLongitude = !isBlank(crd.longitude);
  const flagErrors: AdmissibilityErrors = isCreation(data.operation)
    ? Object.fromEntries(
        CRD_FLAGS.filter((flag) => crd[flag] === null).map((flag) => [
          flag,
          REQUIRED,
        ]),
      )
    : {};
  return {
    ...flagErrors,
    ...(!isAscii(crd.locationNameAscii) && {
      locationNameAscii: "rinf_lc_error_ascii",
    }),
    ...(!isBlank(crd.nutsCode) &&
      !isNutsCode(crd.nutsCode) && { nutsCode: "rinf_lc_error_nuts" }),
    ...(hasLatitude &&
      !isLatitude(crd.latitude) && { latitude: "rinf_lc_error_latitude" }),
    ...(hasLongitude &&
      !isLongitude(crd.longitude) && {
        longitude: "rinf_lc_error_longitude",
      }),
    ...(hasLongitude && !hasLatitude && { latitude: REQUIRED }),
    ...(hasLatitude && !hasLongitude && { longitude: REQUIRED }),
    ...(crd.freeText.length > FREE_TEXT_MAX_LENGTH && {
      freeText: "rinf_lc_error_free_text",
    }),
  };
};

/** An amendment gives at least one new value. */
export const amendsSomething = (data: RequestData): boolean => {
  const crd: CrdAttributes = crdOf(data);
  const texts = [
    data.locationName,
    data.imOrganisationCode,
    crd.locationNameAscii,
    crd.nutsCode,
    crd.latitude,
    crd.freeText,
  ];
  return (
    texts.some((text) => !isBlank(text)) ||
    data.rinfLink !== null ||
    CRD_FLAGS.some((flag) => crd[flag] !== null)
  );
};
