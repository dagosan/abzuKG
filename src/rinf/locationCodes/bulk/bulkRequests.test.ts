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

import { afterEach, describe, expect, it } from "vitest";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import { browserStore } from "../store/browserStore";
import { applyAction } from "../workflow/applyAction";
import { availableActions } from "../workflow/availableActions";
import { emptyRequestData } from "../workflow/createRequest";
import { readBulkFile } from "./bulkFile";
import { requestDataOfLine } from "./bulkLineToRequest";
import { batchPayloadsOf, checksToRead, linesReadyFor } from "./bulkBatch";
import {
  bulkLinesOf,
  bulkReferenceOf,
  bulkRegistrationRefusal,
  bulkWaitsFor,
  groupRequests,
} from "./bulkRequests";

const TODAY = "2026-11-10";
const anna: Actor = { name: "Anna", role: "requester" };
const carl: Actor = { name: "Carl", role: "codeAdministrator" };
const vera: Actor = { name: "Vera", role: "validatingOfficer" };
const rita: Actor = { name: "Rita", role: "rinfCorrespondent" };

const submitter = {
  requester: {
    name: "Anna",
    organisation: "Test RU",
    organisationCode: "1234",
    category: "railwayUndertaking" as const,
    email: "anna@example.eu",
  },
  language: "en",
};

const FILE = [
  "Code_Type,Country_ISO_code,Primary_Location_Code,Subsidiary_Type_Code,Subsidiary_Location_Code,Allocation_Company_Code,Location_Name,Responsible_IM_Code,RINF_Element_Id,Passenger_Possible_Flag,Freight_Possible_Flag,Latitude,Longitude,Justification",
  "PLC,IT,28946,,,,EMPOLI,0083,IT06510,1,0,43.71571,10.94916,Why",
  "PLC,IT,6510,,,,EMPOLI OLD,0083,,,,,,",
  "SLC,BE,438,1,7,0088,Track A,,,,,,,",
].join("\n");

const fileLines = () => readBulkFile(FILE).lines;

const submit = async (): Promise<LocationCodeRequest[]> =>
  browserStore.submitBulk(
    fileLines().map((line) => ({
      line: line.line,
      data: requestDataOfLine(line, submitter, new Set(["IT06510"])),
    })),
    anna,
    "codes.csv",
  );

afterEach(() => window.localStorage.clear());

describe("a file line as a request", () => {
  it("maps the annex's columns to the request form's data", () => {
    const [first, existing, subsidiary] = fileLines().map((line) =>
      requestDataOfLine(line, submitter, new Set(["IT06510"])),
    );
    expect(first).toMatchObject({
      operation: "newCode",
      codeType: "primary",
      country: "IT",
      proposedCode: "IT28946",
      locationName: "EMPOLI",
      imOrganisationCode: "0083",
      rinfLink: { kind: "operationalPoint", canonicalId: "IT06510" },
      justification: "Why",
      preSubmissionConfirmed: true,
      requester: submitter.requester,
    });
    expect(first.crd).toMatchObject({
      latitude: "43.71571",
      longitude: "10.94916",
      passengerPossibleFlag: true,
      freightPossibleFlag: false,
      containerHandlingFlag: null,
    });
    expect(existing).toMatchObject({
      operation: "existingCode",
      proposedCode: "IT06510",
      rinfLink: null,
    });
    expect(subsidiary).toMatchObject({
      operation: "newCode",
      codeType: "subsidiary",
      country: "BE",
      parentPrimaryCode: "BE00438",
      subsidiaryTypeCode: "01",
      proposedCode: "7",
      imOrganisationCode: "",
    });
  });
});

describe("a bulk request in the browser store", () => {
  it("is one request per line, submitted together", async () => {
    const lines = await submit();
    expect(lines.map((line) => line.bulk?.line)).toEqual([2, 3, 4]);
    expect(new Set(lines.map((line) => line.bulk?.id)).size).toBe(1);
    expect(new Set(lines.map((line) => line.submittedAt)).size).toBe(1);
    expect(lines.every((line) => line.status === "submitted")).toBe(true);
    expect(await browserStore.loadRequests()).toHaveLength(3);
  });

  it("is registered under one reference and one T0", async () => {
    const [first] = await submit();
    const bulkId = first.bulk?.id ?? "";
    const registered = await browserStore.registerBulk(bulkId, carl);
    const year = new Date().getFullYear();
    expect(registered.map((line) => line.reference)).toEqual([
      `LC-${year}-0001/2`,
      `LC-${year}-0001/3`,
      `LC-${year}-0001/4`,
    ]);
    expect(new Set(registered.map((line) => line.registeredAt)).size).toBe(1);
    expect(bulkReferenceOf(registered)).toBe(`LC-${year}-0001`);
    // The next request takes the next number, not one per line.
    const single = await browserStore.submitRequest(
      { ...emptyRequestData(), country: "BE" },
      anna,
    );
    const { request } = await browserStore.takeStep({
      requestId: single.id,
      action: "register",
      actor: carl,
      payload: {},
      expectedEventCount: 1,
      endpoint: "",
    });
    expect(request.reference).toBe(`LC-${year}-0002`);
  });

  it("refuses registration twice, or by another role", async () => {
    const [first] = await submit();
    const bulkId = first.bulk?.id ?? "";
    await expect(browserStore.registerBulk(bulkId, vera)).rejects.toThrow(
      "rinf_lc_blocked_wrong_role",
    );
    await browserStore.registerBulk(bulkId, carl);
    await expect(browserStore.registerBulk(bulkId, carl)).rejects.toThrow(
      "rinf_lc_blocked_wrong_status",
    );
    await expect(browserStore.registerBulk("none", carl)).rejects.toThrow(
      "rinf_lc_blocked_wrong_status",
    );
  });

  it("does not let a line be registered on its own", async () => {
    const [first] = await submit();
    const register = availableActions(first, carl, TODAY).find(
      ({ action }) => action === "register",
    );
    expect(register?.blockedBy).toBe("rinf_lc_blocked_bulk_register");
    await expect(
      browserStore.takeStep({
        requestId: first.id,
        action: "register",
        actor: carl,
        payload: {},
        expectedEventCount: 1,
        endpoint: "",
      }),
    ).rejects.toThrow("rinf_lc_blocked_bulk_register");
  });
});

describe("the lines of a bulk request together", () => {
  it("wait for the code administrator until registered, then line by line", async () => {
    const lines = await submit();
    expect(bulkRegistrationRefusal(lines, carl)).toBeNull();
    expect(bulkWaitsFor(lines, carl, TODAY)).toBe(true);
    expect(bulkWaitsFor(lines, vera, TODAY)).toBe(false);
    const registered = await browserStore.registerBulk(
      lines[0].bulk?.id ?? "",
      carl,
    );
    expect(bulkRegistrationRefusal(registered, carl)).toBe(
      "rinf_lc_blocked_wrong_status",
    );
    expect(bulkWaitsFor(registered, carl, TODAY)).toBe(true);
    expect(linesReadyFor(registered, "runChecks", carl, TODAY)).toHaveLength(3);
    expect(linesReadyFor(registered, "runChecks", vera, TODAY)).toHaveLength(0);
    expect(linesReadyFor(registered, "assign", vera, TODAY)).toHaveLength(0);
  });

  it("leave to its own file a line a batch step cannot decide", async () => {
    const lines = await submit();
    const [first, second] = await browserStore.registerBulk(
      lines[0].bulk?.id ?? "",
      carl,
    );
    const now = "2026-11-10T10:00:00.000Z";
    const checked = (
      request: LocationCodeRequest,
      outcome: "pass" | "fail" | "warning",
    ) =>
      applyAction(
        request,
        "runChecks",
        carl,
        {
          checks: [
            { item: "noDuplicate", outcome, detailId: "x" },
            { item: "dataQuality", outcome: "manual", detailId: "y" },
          ],
        },
        now,
      );
    const passing = checked(first, "pass");
    const failing = checked(second, "fail");
    expect(batchPayloadsOf(passing, "confirmCheck")).toEqual([
      { confirmedItem: "dataQuality" },
    ]);
    expect(batchPayloadsOf(passing, "completeValidation")).toEqual([
      { recommendation: { outcome: "assign", ground: null } },
    ]);
    expect(batchPayloadsOf(failing, "completeValidation")).toEqual([]);
    expect(
      batchPayloadsOf(checked(first, "warning"), "completeValidation"),
    ).toEqual([]);
    expect(checksToRead(passing)).toBe("none");
    expect(checksToRead(failing)).toBe("failed");
    const otherCodes = {
      checks: [
        {
          item: "noDuplicate" as const,
          outcome: "pass" as const,
          detailId: "rinf_lc_detail_other_locations",
        },
      ],
    };
    expect(checksToRead(otherCodes)).toBe("otherCodes");
    // First population: the code is in the Knowledge Graph for its own element.
    expect(
      checksToRead({
        checks: [
          {
            item: "codeValueFree",
            outcome: "warning",
            detailId: "rinf_lc_detail_already_in_kg",
          },
        ],
      }),
    ).toBe("none");
    expect(
      batchPayloadsOf({ ...passing, ...otherCodes }, "completeValidation"),
    ).toEqual([]);
    // Validation waits for the manual check, so no line is ready yet.
    expect(
      linesReadyFor([passing, failing], "completeValidation", carl, TODAY),
    ).toHaveLength(0);
    const confirmed = applyAction(
      passing,
      "confirmCheck",
      carl,
      { confirmedItem: "dataQuality" },
      now,
    );
    expect(
      linesReadyFor([confirmed, failing], "completeValidation", carl, TODAY),
    ).toEqual([confirmed]);
    // A position is confirmed in batch only where the line names its element.
    expect(batchPayloadsOf(passing, "confirmPosition")).toEqual([{}]);
    expect(batchPayloadsOf(failing, "confirmPosition")).toEqual([]);
    expect(rita.role).toBe("rinfCorrespondent");
  });

  it("show as one item among the requests", async () => {
    const lines = await submit();
    const single = await browserStore.submitRequest(
      { ...emptyRequestData(), country: "BE" },
      anna,
    );
    const groups = groupRequests([lines[1], single, lines[0], lines[2]]);
    expect(groups.map((group) => group.kind)).toEqual(["bulk", "request"]);
    const [bulk] = groups;
    if (bulk.kind !== "bulk") throw new Error("expected the bulk request");
    expect(bulk.lines.map((line) => line.bulk?.line)).toEqual([2, 3, 4]);
    expect(bulkLinesOf([single], bulk.bulkId)).toEqual([]);
  });
});
