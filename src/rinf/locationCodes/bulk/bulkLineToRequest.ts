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

import type {
  CrdAttributes,
  RequestData,
  Requester,
} from "../model/LocationCodeRequest";
import { emptyRequestData } from "../workflow/createRequest";
import { codeTypeOf } from "./bulkLineChecks";
import { primaryCodeOfLine } from "./bulkLineCodes";
import type { BulkLine } from "./bulkReport";
import { typeCodeOf } from "./bulkValueFormats";

const FLAG_SET = "1";
const FLAG_NOT_SET = "0";

/** "1" → true, "0" → false, empty → null: not stated. */
const flagOf = (value: string | undefined): boolean | null => {
  if (value === FLAG_SET) return true;
  return value === FLAG_NOT_SET ? false : null;
};

const crdOfLine = ({ values }: BulkLine): CrdAttributes => ({
  locationNameAscii: values.Location_Name_ASCII ?? "",
  nutsCode: values.NUTS_Code ?? "",
  latitude: values.Latitude ?? "",
  longitude: values.Longitude ?? "",
  freeText: values.Free_Text ?? "",
  containerHandlingFlag: flagOf(values.Container_Handling_Flag),
  handoverPointFlag: flagOf(values.Handover_Point_Flag),
  freightPossibleFlag: flagOf(values.Freight_Possible_Flag),
  passengerPossibleFlag: flagOf(values.Passenger_Possible_Flag),
});

/** Who asks, once for the whole file (Annex A: not columns of the file). */
export interface BulkSubmitter {
  requester: Requester;
  language: string;
}

/**
 * The request a file line asks for (Annex A.2 → the request form's data).
 * A proposed PLC the Knowledge Graph already holds is the first population
 * of an existing code; any other line asks for a new one. Start_Validity
 * and the validity dates of freight and passenger use have no place in a
 * request yet: the dates of a code follow from the decision.
 */
export const requestDataOfLine = (
  line: BulkLine,
  { requester, language }: BulkSubmitter,
  existingCodes: ReadonlySet<string>,
): RequestData => {
  const { values } = line;
  const isPrimary = codeTypeOf(line) === "PLC";
  const primaryCode = primaryCodeOfLine(line) ?? "";
  const rinfElement = values.RINF_Element_Id ?? "";
  return {
    ...emptyRequestData(),
    operation:
      isPrimary && existingCodes.has(primaryCode) ? "existingCode" : "newCode",
    codeType: isPrimary ? "primary" : "subsidiary",
    country: values.Country_ISO_code ?? "",
    proposedCode: isPrimary
      ? primaryCode
      : (values.Subsidiary_Location_Code ?? ""),
    locationName: values.Location_Name ?? "",
    imOrganisationCode: isPrimary ? (values.Responsible_IM_Code ?? "") : "",
    crd: crdOfLine(line),
    // The annex does not yet say how a section of line is written (A.5).
    rinfLink: rinfElement
      ? {
          kind: "operationalPoint",
          canonicalId: rinfElement,
          label: values.Location_Name ?? rinfElement,
        }
      : null,
    parentPrimaryCode: isPrimary ? "" : primaryCode,
    subsidiaryTypeCode: isPrimary
      ? ""
      : (typeCodeOf(values.Subsidiary_Type_Code ?? "") ?? ""),
    justification: values.Justification ?? "",
    language,
    requester,
    preSubmissionConfirmed: true,
  };
};
