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
import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import { applyAction } from "./applyAction";
import { availableActions } from "./availableActions";
import { createRequest, emptyRequestData } from "./createRequest";
import { currentDeadline, elapsedSinceRegistration } from "./deadlines";
import { registerChanges } from "./publication";
import { addWorkingDays, workingDaysBetween } from "./workingDays";

const requester: Actor = { name: "Ann Requester", role: "requester" };
const administrator: Actor = { name: "Bob Admin", role: "codeAdministrator" };
const correspondent: Actor = { name: "Cy Rinf", role: "rinfCorrespondent" };
const officer: Actor = { name: "Dee Officer", role: "validatingOfficer" };

const primaryData = (): RequestData => ({
  ...emptyRequestData(),
  country: "BE",
  locationName: "Gembloux Nord",
  imOrganisationCode: "0088",
  rinfLink: {
    kind: "operationalPoint",
    canonicalId: "BEXYZ",
    label: "Gembloux Nord",
  },
});

const blockedBy = (
  request: LocationCodeRequest,
  actor: Actor,
  action: string,
) =>
  availableActions(request, actor, "2026-10-29").find(
    (item) => item.action === action,
  )?.blockedBy;

describe("working days", () => {
  it("skips weekends", () => {
    // Thu 29 Oct 2026 to Mon 2 Nov 2026: Fri and Mon.
    expect(workingDaysBetween("2026-10-29", "2026-11-02")).toBe(2);
    expect(addWorkingDays("2026-10-29", 2)).toBe("2026-11-02");
  });
});

describe("a PLC request through every step", () => {
  const steps = () => {
    let request = createRequest(
      "r1",
      primaryData(),
      requester,
      "2026-10-01T09:00:00Z",
    );
    request = applyAction(
      request,
      "register",
      administrator,
      { reference: "LC-2026-0001" },
      "2026-10-01T10:00:00Z",
    );
    request = applyAction(
      request,
      "runChecks",
      administrator,
      { checks: [], assignableCode: "BE00001" },
      "2026-10-02T10:00:00Z",
    );
    return request;
  };

  it("goes to RINF harmonisation, then decision, then publication", () => {
    let request = steps();
    expect(request.status).toBe("registered");
    request = applyAction(
      request,
      "completeValidation",
      administrator,
      {},
      "2026-10-02T11:00:00Z",
    );
    expect(request.status).toBe("rinfHarmonisation");
    request = applyAction(
      request,
      "confirmPosition",
      correspondent,
      {},
      "2026-10-03T09:00:00Z",
    );
    expect(request.status).toBe("awaitingDecision");
    expect(blockedBy(request, officer, "assign")).toBeNull();
    request = applyAction(
      request,
      "assign",
      officer,
      { code: "BE00001" },
      "2026-10-05T09:00:00Z",
    );
    expect(request.status).toBe("assigned");
    request = applyAction(
      request,
      "publish",
      administrator,
      {},
      "2026-10-05T10:00:00Z",
    );
    const codes = registerChanges(request, [], [], "2026-10-05T10:00:00Z");
    expect(codes).toHaveLength(1);
    expect(codes[0]).toMatchObject({
      key: "BE00001",
      validFrom: "2026-10-05",
      closedFrom: null,
    });
  });

  it("does not let the code administrator decide (four eyes)", () => {
    let request = steps();
    request = applyAction(
      request,
      "completeValidation",
      administrator,
      {},
      "2026-10-02T11:00:00Z",
    );
    request = applyAction(
      request,
      "confirmPosition",
      correspondent,
      {},
      "2026-10-03T09:00:00Z",
    );
    const sameAsAdministrator: Actor = {
      name: "bob admin ",
      role: "validatingOfficer",
    };
    expect(blockedBy(request, sameAsAdministrator, "assign")).toBe(
      "rinf_lc_blocked_four_eyes",
    );
  });

  it("stops the clock while information is requested", () => {
    let request = steps();
    request = applyAction(
      request,
      "requestInformation",
      administrator,
      {},
      "2026-10-05T09:00:00Z",
    );
    expect(currentDeadline(request, "2026-10-07")?.milestone).toBe(
      "informationReply",
    );
    request = applyAction(
      request,
      "replyToInformationRequest",
      requester,
      {},
      "2026-10-09T09:00:00Z",
    );
    expect(request.status).toBe("registered");
    expect(request.checksRunAt).toBeNull();
    // 1 Oct to 12 Oct is 7 working days; 5 to 9 Oct (4) were suspended.
    expect(elapsedSinceRegistration(request, "2026-10-12")).toBe(3);
  });

  it("only lets the submitter reply", () => {
    let request = steps();
    request = applyAction(
      request,
      "requestInformation",
      administrator,
      {},
      "2026-10-05T09:00:00Z",
    );
    const otherRequester: Actor = { name: "Someone Else", role: "requester" };
    expect(
      blockedBy(request, otherRequester, "replyToInformationRequest"),
    ).toBe("rinf_lc_blocked_not_submitter");
  });
});

describe("closing a PLC", () => {
  it("closes dependent SLCs from the register and the KG", () => {
    let request = createRequest(
      "r2",
      {
        ...primaryData(),
        operation: "deactivation",
        targetCode: "BE00001",
        effectiveDate: "2026-12-01",
        closeDependentCodes: true,
      },
      requester,
      "2026-10-01T09:00:00Z",
    );
    request = applyAction(
      request,
      "assign",
      officer,
      { code: "BE00001" },
      "2026-10-02T09:00:00Z",
    );
    const register = [
      {
        key: "BE00001",
        codeType: "primary" as const,
        code: "BE00001",
        parentPrimaryCode: null,
        country: "BE",
        name: "X",
        imOrganisationCode: "0088",
        subsidiaryTypeCode: "",
        rinfLink: null,
        validFrom: "2026-01-01",
        closedFrom: null,
        history: [],
      },
      {
        key: "BE00001/0000000001",
        codeType: "subsidiary" as const,
        code: "0000000001",
        parentPrimaryCode: "BE00001",
        country: "BE",
        name: "Track 1",
        imOrganisationCode: "",
        subsidiaryTypeCode: "01",
        rinfLink: null,
        validFrom: "2026-01-01",
        closedFrom: null,
        history: [],
      },
    ];
    const changes = registerChanges(
      request,
      register,
      ["NO-S.1"],
      "2026-10-03T09:00:00Z",
    );
    expect(changes.map((code) => code.key).sort()).toEqual([
      "BE00001",
      "BE00001/0000000001",
      "BE00001/NO-S.1",
    ]);
    expect(changes.every((code) => code.closedFrom === "2026-12-01")).toBe(
      true,
    );
  });
});

describe("RINF harmonisation for an SLC", () => {
  const slcData = (withTrack: boolean): RequestData => ({
    ...emptyRequestData(),
    codeType: "subsidiary",
    parentPrimaryCode: "BE00438",
    subsidiaryTypeCode: "01",
    locationName: "Track III",
    rinfLink: withTrack
      ? {
          kind: "asset",
          canonicalId: "http://data.europa.eu/949/track/x",
          label: "voie III",
          parent: {
            kind: "operationalPoint",
            canonicalId: "BELGB",
            label: "Gembloux",
          },
        }
      : null,
  });
  const validated = (data: RequestData) => {
    let request = createRequest("s", data, requester, "2026-10-01T09:00:00Z");
    request = applyAction(
      request,
      "register",
      administrator,
      {},
      "2026-10-01T10:00:00Z",
    );
    request = applyAction(
      request,
      "runChecks",
      administrator,
      { checks: [] },
      "2026-10-01T11:00:00Z",
    );
    return applyAction(
      request,
      "completeValidation",
      administrator,
      {},
      "2026-10-01T12:00:00Z",
    );
  };

  it("goes to the RINF correspondent when positioned on a track", () => {
    expect(validated(slcData(true)).status).toBe("rinfHarmonisation");
  });

  it("inherits the parent's position otherwise", () => {
    const request = validated(slcData(false));
    expect(request.status).toBe("awaitingDecision");
    expect(request.rinfPosition?.outcome).toBe("inherited");
  });
});
