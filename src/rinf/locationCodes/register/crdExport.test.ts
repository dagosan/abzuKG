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

import { describe, expect, it } from "vitest";
import { aCodeVersion } from "../testing/codeVersionFixture";
import { CRD_COLUMNS, crdCsv, crdLocationNumber } from "./crdExport";

/** Header and a row of "2026_10_30 - All CRD PLCs.csv". */
const CRD_HEADER =
  "Country_ISO_code,Primary_Location_Code,Start_Validity,End_Validity,Responsible_IM_Code,Location_Name,Location_Name_ASCII,NUTS_Code,Container_Handling_Flag,Handover_Point_Flag,Freight_Possible_Flag,Freight_Start_Validity,Freight_End_Validity,Passenger_Possible_Flag,Passenger_Start_Validity,Passenger_End_Validity,Latitude,Longitude,Free_Text,Active_Flag,Add_Date,Mod_Date";
const CRD_ROW =
  'SI,42000,1997-01-01,,0079,Dobova d.m.,Dobova d.m.,,0,0,0,,,0,,,45.890692,15.680184,"Border, državna meja",1,2013-05-17 12:49:01,2018-11-20 11:16:19';

describe("CRD export", () => {
  it("has CRD's columns in CRD's order", () => {
    expect(CRD_COLUMNS.join(",")).toBe(CRD_HEADER);
  });

  it("writes a version as CRD writes it", () => {
    const version = aCodeVersion({
      key: "SI42000",
      code: "SI42000",
      countryIsoCode: "SI",
      startValidity: "1997-01-01",
      responsibleImCode: "0079",
      locationName: "Dobova d.m.",
      locationNameAscii: "Dobova d.m.",
      latitude: 45.890692,
      longitude: 15.680184,
      freeText: "Border, državna meja",
      addDate: "2013-05-17T12:49:01.000Z",
      modDate: "2018-11-20T11:16:19.000Z",
    });
    expect(crdCsv([version], "2026-11-02")).toBe(`${CRD_HEADER}\n${CRD_ROW}\n`);
  });

  it("drops the leading zeros, leaves SLCs out", () => {
    expect(crdLocationNumber("BE00438")).toBe("438");
    const slc = aCodeVersion({
      key: "BE00001/1",
      codeType: "subsidiary",
      code: "1",
      parentPrimaryCode: "BE00001",
    });
    expect(crdCsv([slc], "2026-11-02")).toBe(`${CRD_HEADER}\n`);
  });
});
