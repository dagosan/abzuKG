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
import { admissibilityErrors } from "../checks/admissibility";
import { changeConflict } from "../checks/checkContext";
import { asciiName } from "../model/asciiName";
import { currentVersions, isActiveOn } from "../model/codeVersions";
import { upgradeCodes } from "../model/legacyCodes";
import {
  emptyCrdAttributes,
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import { aCodeVersion } from "../testing/codeVersionFixture";
import { createRequest, emptyRequestData } from "./createRequest";
import { EFFECTIVE_DATE_REFUSAL, registerChanges } from "./publication";

const NOW = "2026-11-02T09:00:00.000Z";
const requester = { name: "Ann", role: "requester" as const };

const published = (
  data: Partial<RequestData>,
  code: string,
): LocationCodeRequest => ({
  ...createRequest("r1", { ...emptyRequestData(), ...data }, requester, NOW),
  reference: "LC-2026-0002",
  decision: {
    outcome: "assign",
    ground: null,
    provision: "",
    code,
    note: "",
    by: { name: "Dee", role: "validatingOfficer" },
    at: NOW,
  },
});

describe("versions of a code, as CRD keeps them", () => {
  it("creates version 1 with the CRD columns of the request", () => {
    const request = published(
      {
        country: "BE",
        locationName: "Hst außer Betrieb",
        imOrganisationCode: "0088",
        crd: {
          ...emptyCrdAttributes(),
          latitude: "50,560129",
          longitude: "4.690778",
          nutsCode: "be352",
          passengerPossibleFlag: true,
          freightPossibleFlag: false,
          containerHandlingFlag: false,
          handoverPointFlag: true,
        },
      },
      "BE00500",
    );
    const [version] = registerChanges(request, [], [], NOW);
    expect(version).toMatchObject({
      key: "BE00500",
      version: 1,
      countryIsoCode: "BE",
      startValidity: "2026-11-02",
      endValidity: null,
      locationNameAscii: "Hst ausser Betrieb",
      nutsCode: "BE352",
      latitude: 50.560129,
      longitude: 4.690778,
      passengerPossibleFlag: true,
      passengerStartValidity: "2026-11-02",
      freightPossibleFlag: false,
      freightStartValidity: null,
      handoverPointFlag: true,
      openedBy: { change: "assigned", reference: "LC-2026-0002" },
    });
  });

  it("ends the current version the day before an amendment and opens the next", () => {
    const current = aCodeVersion({
      passengerPossibleFlag: true,
      passengerStartValidity: "2026-01-01",
    });
    const request = published(
      {
        operation: "amendment",
        targetCode: "BE00001",
        effectiveDate: "2026-12-13",
        locationName: "Gembloux-Nord",
        crd: { ...emptyCrdAttributes(), freightPossibleFlag: true },
      },
      "BE00001",
    );
    const [ended, next] = registerChanges(request, [current], [], NOW);
    expect(ended).toMatchObject({
      version: 1,
      endValidity: "2026-12-12",
      endedBy: { change: "amended" },
      locationName: "Test",
    });
    expect(next).toMatchObject({
      version: 2,
      startValidity: "2026-12-13",
      endValidity: null,
      locationName: "Gembloux-Nord",
      locationNameAscii: "Gembloux-Nord",
      responsibleImCode: "0088",
      passengerPossibleFlag: true,
      passengerStartValidity: "2026-01-01",
      freightPossibleFlag: true,
      freightStartValidity: "2026-12-13",
      openedBy: { change: "amended" },
    });
    expect(currentVersions([ended, next])).toEqual([next]);
    expect(isActiveOn(ended, "2026-12-12")).toBe(true);
    expect(isActiveOn(next, "2026-12-12")).toBe(false);
  });

  it("closes a code: last day the day before, uses ended with it", () => {
    const current = aCodeVersion({
      freightPossibleFlag: true,
      freightStartValidity: "2026-01-01",
    });
    const request = published(
      {
        operation: "deactivation",
        targetCode: "BE00001",
        effectiveDate: "2027-01-01",
        justification: "Line closed",
      },
      "BE00001",
    );
    const [closed] = registerChanges(request, [current], [], NOW);
    expect(closed).toMatchObject({
      endValidity: "2026-12-31",
      freightEndValidity: "2026-12-31",
      passengerEndValidity: null,
      endedBy: { change: "closed" },
    });
  });

  it("refuses a change taking effect before the current version starts", () => {
    const current = aCodeVersion({ startValidity: "2026-12-13" });
    const request = published(
      {
        operation: "amendment",
        targetCode: "BE00001",
        effectiveDate: "2026-12-13",
        locationName: "New",
      },
      "BE00001",
    );
    expect(() => registerChanges(request, [current], [], NOW)).toThrow(
      EFFECTIVE_DATE_REFUSAL,
    );
    expect(changeConflict(current, "2026-12-13")?.detailId).toBe(
      "rinf_lc_detail_effective_too_early",
    );
    expect(changeConflict(current, "2026-12-14")).toBeNull();
  });

  it("records a code known only from the KG as version 1 before it changes", () => {
    const request = published(
      {
        operation: "amendment",
        targetCode: "BE00438",
        effectiveDate: "2026-12-13",
        locationName: "Gembloux",
      },
      "BE00438",
    );
    const [fromKg, next] = registerChanges(request, [], [], NOW);
    expect(fromKg).toMatchObject({
      version: 1,
      startValidity: null,
      endValidity: "2026-12-12",
      openedBy: null,
    });
    expect(next).toMatchObject({ version: 2, locationName: "Gembloux" });
  });
});

describe("CRD columns on the request form", () => {
  const plc = (crd: Partial<RequestData["crd"]>): RequestData => ({
    ...emptyRequestData(),
    country: "BE",
    locationName: "X",
    imOrganisationCode: "0088",
    crd: { ...emptyCrdAttributes(), ...crd },
  });

  it("asks for the four flags of a new PLC", () => {
    const errors = admissibilityErrors(plc({}));
    expect(errors.passengerPossibleFlag).toBe("rinf_lc_error_required");
    expect(errors.handoverPointFlag).toBe("rinf_lc_error_required");
  });

  it("checks the form of ASCII name, NUTS code and position", () => {
    const errors = admissibilityErrors(
      plc({
        locationNameAscii: "Grimsås",
        nutsCode: "BE-352",
        latitude: "95",
      }),
    );
    expect(errors.locationNameAscii).toBe("rinf_lc_error_ascii");
    expect(errors.nutsCode).toBe("rinf_lc_error_nuts");
    expect(errors.latitude).toBe("rinf_lc_error_latitude");
    expect(errors.longitude).toBe("rinf_lc_error_required");
  });

  it("lets an amendment change only a flag", () => {
    const errors = admissibilityErrors({
      ...plc({ freightPossibleFlag: false }),
      operation: "amendment",
      targetCode: "BE00001",
      effectiveDate: "2026-12-13",
      locationName: "",
      imOrganisationCode: "",
    });
    expect(errors.locationName).toBeUndefined();
    expect(errors.passengerPossibleFlag).toBeUndefined();
  });
});

describe("helpers", () => {
  it("makes CRD's ASCII name", () => {
    expect(asciiName("Grimsås")).toBe("Grimsas");
    expect(asciiName("Poznań Główny")).toBe("Poznan Glowny");
    expect(asciiName("Køge Nord")).toBe("Koge Nord");
  });

  it("turns an entry saved before versions into version 1", () => {
    const [version] = upgradeCodes([
      {
        key: "SE00001",
        codeType: "primary",
        code: "SE00001",
        parentPrimaryCode: null,
        country: "SE",
        name: "Myrbacken",
        imOrganisationCode: "0074",
        subsidiaryTypeCode: "",
        rinfLink: null,
        validFrom: "2026-10-30",
        closedFrom: "2026-12-13",
        history: [
          {
            at: NOW,
            requestId: "a",
            reference: "LC-2026-0001",
            change: "assigned",
          },
          {
            at: NOW,
            requestId: "b",
            reference: "LC-2026-0005",
            change: "closed",
          },
        ],
      },
    ]);
    expect(version).toMatchObject({
      version: 1,
      countryIsoCode: "SE",
      startValidity: "2026-10-30",
      endValidity: "2026-12-12",
      locationName: "Myrbacken",
      responsibleImCode: "0074",
      openedBy: { requestId: "a" },
      endedBy: { requestId: "b" },
    });
  });
});
