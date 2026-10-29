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

import { describe, expect, it } from "vitest";
import {
  lowestFreeNumber,
  lowestFreeSubsidiaryCode,
  parsePrimaryCode,
} from "../model/codeFormat";
import type { RequestData } from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import { createRequest, emptyRequestData } from "../workflow/createRequest";
import { admissibilityErrors } from "./admissibility";
import { assignableCode } from "./assignableCode";
import type { CheckContext } from "./checkContext";
import { runTechnicalChecks } from "./technicalChecks";

const requester: Actor = { name: "Ann", role: "requester" };

const completeData = (overrides: Partial<RequestData> = {}): RequestData => ({
  ...emptyRequestData(),
  country: "BE",
  locationName: "Gembloux Nord",
  imOrganisationCode: "0088",
  rinfLink: {
    kind: "operationalPoint",
    canonicalId: "BEXYZ",
    label: "Gembloux Nord",
  },
  preSubmissionConfirmed: true,
  requester: {
    name: "Ann",
    organisation: "Infrabel",
    organisationCode: "0088",
    category: "infrastructureManager",
    email: "ann@example.org",
  },
  ...overrides,
});

const context = (overrides: Partial<CheckContext> = {}): CheckContext => ({
  today: "2026-10-29",
  kgCountryCodes: ["BE00001", "BE00002", "BE00004"],
  kgProposedCode: null,
  kgPrimaryCode: null,
  kgSubsidiaryCodes: [],
  rinfElement: {
    exists: true,
    validToday: true,
    label: "Gembloux Nord",
    codes: [],
  },
  register: [],
  otherOpenRequests: [],
  ...overrides,
});

const outcomeOf = (
  data: RequestData,
  checkContext: CheckContext,
  item: string,
) =>
  runTechnicalChecks(
    createRequest("r", data, requester, "2026-10-29T09:00:00Z"),
    checkContext,
  ).find((result) => result.item === item)?.outcome;

describe("code values", () => {
  it("parses and finds the lowest free number", () => {
    expect(parsePrimaryCode("be00438")).toEqual({
      country: "BE",
      locationNumber: 438,
    });
    expect(parsePrimaryCode("BE0043")).toBeNull();
    expect(lowestFreeNumber(new Set([1, 2, 4]))).toBe(3);
    expect(lowestFreeSubsidiaryCode(["0000000001", "NO-S.1"])).toBe(
      "0000000002",
    );
  });

  it("assigns the proposed value when free, else the lowest free one", () => {
    const free = createRequest(
      "r",
      completeData({ proposedCode: "BE00010" }),
      requester,
      "now",
    );
    expect(assignableCode(free, context())).toBe("BE00010");
    const taken = createRequest(
      "r",
      completeData({ proposedCode: "BE00002" }),
      requester,
      "now",
    );
    expect(assignableCode(taken, context())).toBe("BE00003");
  });

  it("does not hand the same value to two open requests", () => {
    const other = {
      ...createRequest("o", completeData(), requester, "now"),
      assignableCode: "BE00003",
    };
    const request = createRequest("r", completeData(), requester, "now");
    expect(
      assignableCode(request, context({ otherOpenRequests: [other] })),
    ).toBe("BE00005");
  });
});

describe("admissibility", () => {
  it("accepts a complete PLC request", () => {
    expect(admissibilityErrors(completeData())).toEqual({});
  });

  it("requires a parent PLC and type code for an SLC", () => {
    const errors = admissibilityErrors(
      completeData({ codeType: "subsidiary" }),
    );
    expect(errors.parentPrimaryCode).toBeDefined();
    expect(errors.subsidiaryTypeCode).toBeDefined();
  });
});

describe("technical checks", () => {
  it("fails when the OP already carries a PLC", () => {
    const withCode = context({
      rinfElement: {
        exists: true,
        validToday: true,
        label: "X",
        codes: ["BE00438"],
      },
    });
    expect(outcomeOf(completeData(), withCode, "noDuplicate")).toBe("fail");
  });

  it("fails for an SLC whose parent is unknown", () => {
    const data = completeData({
      codeType: "subsidiary",
      parentPrimaryCode: "BE09999",
      subsidiaryTypeCode: "01",
    });
    expect(outcomeOf(data, context(), "parentPrimaryCode")).toBe("fail");
  });

  it("asks to consult the IM when an RU requests a track code", () => {
    const data = completeData({
      codeType: "subsidiary",
      parentPrimaryCode: "BE00001",
      subsidiaryTypeCode: "01",
      requester: {
        ...completeData().requester,
        category: "railwayUndertaking",
      },
    });
    const parentKnown = context({
      kgPrimaryCode: { code: "BE00001", names: [], operationalPoints: [] },
    });
    expect(outcomeOf(data, parentKnown, "entitledRequester")).toBe("manual");
    expect(outcomeOf(data, parentKnown, "parentPrimaryCode")).toBe("pass");
  });

  it("refuses to close a PLC with active SLCs unless they close too", () => {
    const data = completeData({
      operation: "deactivation",
      targetCode: "BE00001",
      effectiveDate: "2026-12-01",
    });
    const withDependants = context({
      kgSubsidiaryCodes: ["A1"],
      kgPrimaryCode: { code: "BE00001", names: [], operationalPoints: [] },
    });
    expect(outcomeOf(data, withDependants, "dependentCodes")).toBe("fail");
    expect(
      outcomeOf(
        { ...data, closeDependentCodes: true },
        withDependants,
        "dependentCodes",
      ),
    ).toBe("warning");
  });
});
