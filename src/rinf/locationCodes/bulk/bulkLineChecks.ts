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

import { isAscii } from "../model/asciiName";
import { isCountryPrefix } from "../model/countries";
import {
  BULK_COLUMNS,
  BulkCodeType,
  REQUIRED_COLUMNS,
  UNUSED_COLUMNS,
} from "./bulkColumns";
import { primaryLineFailures } from "./bulkPrimaryChecks";
import { BulkFailure, BulkLine, failure } from "./bulkReport";
import { subsidiaryLineFailures } from "./bulkSubsidiaryChecks";
import {
  FREE_TEXT_MAX_LENGTH,
  isCountryCode,
  isDecimalDegrees,
  isIsoDate,
  isNullWord,
  JUSTIFICATION_MAX_LENGTH,
  MAX_LATITUDE,
  MAX_LONGITUDE,
  NAME_MAX_LENGTH,
} from "./bulkValueFormats";

export const codeTypeOf = ({ values }: BulkLine): BulkCodeType | null =>
  values.Code_Type === "PLC" || values.Code_Type === "SLC"
    ? values.Code_Type
    : null;

/** What every column must respect: required, unused, and no "null" for empty. */
const columnUseFailures = (
  line: BulkLine,
  kind: BulkCodeType,
): BulkFailure[] => [
  ...BULK_COLUMNS.filter((column) => isNullWord(line.values[column] ?? "")).map(
    (column) =>
      failure(column, "A1", "rinf_lc_bulk_null_word", {
        value: line.values[column] ?? "",
      }),
  ),
  ...REQUIRED_COLUMNS[kind]
    .filter((column) => !line.values[column])
    .map((column) => failure(column, "A1", "rinf_lc_bulk_required")),
  ...UNUSED_COLUMNS[kind]
    .filter((column) => line.values[column])
    .map((column) =>
      failure(column, "FILE", "rinf_lc_bulk_unused", { codeType: kind }),
    ),
];

const countryFailures = (country: string, today: string): BulkFailure[] => {
  if (!country) return [];
  if (!isCountryCode(country))
    return [failure("Country_ISO_code", "A1", "rinf_lc_bulk_country_format")];
  return isCountryPrefix(country, today)
    ? []
    : [
        failure("Country_ISO_code", "A1", "rinf_lc_bulk_country_unknown", {
          country,
        }),
      ];
};

const positionFailures = ({ values }: BulkLine): BulkFailure[] => {
  const latitude = values.Latitude ?? "";
  const longitude = values.Longitude ?? "";
  if (!latitude && !longitude) return [];
  if (!latitude || !longitude)
    return [
      failure(
        latitude ? "Longitude" : "Latitude",
        "A1",
        "rinf_lc_bulk_coordinate_pair",
      ),
    ];
  return [
    ...(isDecimalDegrees(latitude, MAX_LATITUDE)
      ? []
      : [failure("Latitude", "A1", "rinf_lc_bulk_latitude")]),
    ...(isDecimalDegrees(longitude, MAX_LONGITUDE)
      ? []
      : [failure("Longitude", "A1", "rinf_lc_bulk_longitude")]),
  ];
};

const tooLong = (
  line: BulkLine,
  column:
    "Location_Name" | "Location_Name_ASCII" | "Free_Text" | "Justification",
  max: number,
): BulkFailure[] =>
  (line.values[column] ?? "").length > max
    ? [failure(column, "A1", "rinf_lc_bulk_text_length", { max })]
    : [];

/** The columns a PLC line and an SLC line share. */
const sharedFailures = (line: BulkLine, today: string): BulkFailure[] => {
  const { values } = line;
  return [
    ...countryFailures(values.Country_ISO_code ?? "", today),
    ...tooLong(line, "Location_Name", NAME_MAX_LENGTH),
    ...tooLong(line, "Location_Name_ASCII", NAME_MAX_LENGTH),
    ...(isAscii(values.Location_Name_ASCII ?? "")
      ? []
      : [failure("Location_Name_ASCII", "A1", "rinf_lc_bulk_ascii")]),
    ...(!values.Start_Validity || isIsoDate(values.Start_Validity)
      ? []
      : [failure("Start_Validity", "A1", "rinf_lc_bulk_date")]),
    ...positionFailures(line),
    ...tooLong(line, "Free_Text", FREE_TEXT_MAX_LENGTH),
    ...tooLong(line, "Justification", JUSTIFICATION_MAX_LENGTH),
  ];
};

/**
 * The format and rules of Annex A.2 applied to one line on its own. Every
 * failure is reported, not only the first. A line with the wrong number of
 * fields, or without a kind, is not checked further: its columns cannot be
 * told apart.
 */
export const lineFormatFailures = (
  line: BulkLine,
  today: string,
): BulkFailure[] => {
  if (line.fieldCount !== line.headerFieldCount)
    return [
      failure(null, "FILE", "rinf_lc_bulk_line_fields", {
        count: line.fieldCount,
        expected: line.headerFieldCount,
      }),
    ];
  const kind = codeTypeOf(line);
  if (!kind) return [failure("Code_Type", "A1", "rinf_lc_bulk_code_type")];
  return [
    ...columnUseFailures(line, kind),
    ...sharedFailures(line, today),
    ...(kind === "PLC"
      ? primaryLineFailures(line)
      : subsidiaryLineFailures(line, today)),
  ];
};
