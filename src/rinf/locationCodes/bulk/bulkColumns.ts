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

/**
 * The columns of the bulk request CSV file (LCMS specification, Annex A.2),
 * in the order of the template. The names follow the CRD export where the
 * meaning is the same.
 */
export const BULK_COLUMNS = [
  "Code_Type",
  "Country_ISO_code",
  "Primary_Location_Code",
  "Subsidiary_Type_Code",
  "Subsidiary_Location_Code",
  "Allocation_Company_Code",
  "Location_Name",
  "Location_Name_ASCII",
  "Responsible_IM_Code",
  "RINF_Element_Id",
  "Start_Validity",
  "NUTS_Code",
  "Container_Handling_Flag",
  "Handover_Point_Flag",
  "Freight_Possible_Flag",
  "Freight_Start_Validity",
  "Freight_End_Validity",
  "Passenger_Possible_Flag",
  "Passenger_Start_Validity",
  "Passenger_End_Validity",
  "Latitude",
  "Longitude",
  "Free_Text",
  "Justification",
] as const;

export type BulkColumn = (typeof BULK_COLUMNS)[number];

export type BulkCodeType = "PLC" | "SLC";

export const isBulkColumn = (name: string): name is BulkColumn =>
  (BULK_COLUMNS as readonly string[]).includes(name);

/** Columns that must have a value on a line of each kind. */
export const REQUIRED_COLUMNS: Record<BulkCodeType, BulkColumn[]> = {
  PLC: [
    "Code_Type",
    "Country_ISO_code",
    "Location_Name",
    "Responsible_IM_Code",
  ],
  SLC: [
    "Code_Type",
    "Country_ISO_code",
    "Primary_Location_Code",
    "Subsidiary_Type_Code",
    "Allocation_Company_Code",
    "Location_Name",
  ],
};

/** Columns that must be empty on a line of each kind: they belong to the other. */
export const UNUSED_COLUMNS: Record<BulkCodeType, BulkColumn[]> = {
  PLC: [
    "Subsidiary_Type_Code",
    "Subsidiary_Location_Code",
    "Allocation_Company_Code",
  ],
  SLC: [
    "Responsible_IM_Code",
    "RINF_Element_Id",
    "NUTS_Code",
    "Container_Handling_Flag",
    "Handover_Point_Flag",
    "Freight_Possible_Flag",
    "Freight_Start_Validity",
    "Freight_End_Validity",
    "Passenger_Possible_Flag",
    "Passenger_Start_Validity",
    "Passenger_End_Validity",
  ],
};

/** Annex A.1: at most this many data lines in one file. */
export const MAX_BULK_LINES = 500;

/** The header line alone: the template a requester starts from. */
export const bulkTemplateCsv = (): string => `${BULK_COLUMNS.join(",")}\n`;
