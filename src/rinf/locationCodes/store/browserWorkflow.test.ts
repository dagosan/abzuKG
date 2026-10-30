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

Added for the ERA RINF frontend, 2026-10-30. */

import { describe, expect, it } from "vitest";
import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import type { WorkflowAction } from "../workflow/actions";
import type { ActionPayload } from "../workflow/applyAction";
import { createRequest, emptyRequestData } from "../workflow/createRequest";
import { takeStepInBrowser } from "./browserWorkflow";
import type { LocationCodeSnapshot } from "./LocationCodeStore";
import {
  STALE_ERROR,
  WRONG_ROLE_ERROR,
  WRONG_STATUS_ERROR,
} from "./storeErrors";

const requester: Actor = { name: "Ann Requester", role: "requester" };
const administrator: Actor = { name: "Bob Admin", role: "codeAdministrator" };
const correspondent: Actor = { name: "Cy Rinf", role: "rinfCorrespondent" };
const officer: Actor = { name: "Dee Officer", role: "validatingOfficer" };
const ENDPOINT = "https://kg.test/sparql";

const data = (): RequestData => ({
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

const snapshotWith = (request: LocationCodeRequest): LocationCodeSnapshot => ({
  requests: [request],
  codes: [],
  sequences: {},
});

/** Takes a step on the only request of the snapshot. */
const take = async (
  snapshot: LocationCodeSnapshot,
  action: WorkflowAction,
  actor: Actor,
  payload: ActionPayload = {},
) => {
  const [request] = snapshot.requests;
  return takeStepInBrowser(snapshot, {
    requestId: request.id,
    action,
    actor,
    payload,
    expectedEventCount: request.events.length,
    endpoint: ENDPOINT,
  });
};

const submitted = () =>
  snapshotWith(
    createRequest("r1", data(), requester, "2026-10-29T09:00:00.000Z"),
  );

describe("steps taken in the browser", () => {
  it("gives the next reference of the year and counts it", async () => {
    const { result, snapshot } = await take(
      submitted(),
      "register",
      administrator,
    );
    const year = new Date().getFullYear();
    expect(result.request.reference).toBe(`LC-${year}-0001`);
    expect(snapshot.sequences[String(year)]).toBe(1);
    expect(snapshot.requests[0].status).toBe("registered");
  });

  it("refuses a step like Tiamat does", async () => {
    await expect(take(submitted(), "publish", administrator)).rejects.toThrow(
      WRONG_STATUS_ERROR,
    );
    await expect(take(submitted(), "register", officer)).rejects.toThrow(
      WRONG_ROLE_ERROR,
    );
    const stale = submitted();
    await expect(
      takeStepInBrowser(stale, {
        requestId: "r1",
        action: "register",
        actor: administrator,
        payload: {},
        expectedEventCount: 0,
        endpoint: ENDPOINT,
      }),
    ).rejects.toThrow(STALE_ERROR);
  });

  it("keeps the four-eyes rule", async () => {
    let snapshot = (await take(submitted(), "register", administrator))
      .snapshot;
    snapshot = (
      await take(snapshot, "runChecks", administrator, {
        checks: [],
        assignableCode: "BE09999",
      })
    ).snapshot;
    snapshot = (await take(snapshot, "completeValidation", administrator))
      .snapshot;
    snapshot = (await take(snapshot, "confirmPosition", correspondent))
      .snapshot;
    const bobAsOfficer: Actor = { ...administrator, role: "validatingOfficer" };
    await expect(
      take(snapshot, "assign", bobAsOfficer, { code: "BE09999" }),
    ).rejects.toThrow("rinf_lc_blocked_four_eyes");

    const assigned = await take(snapshot, "assign", officer, {
      code: "BE09999",
    });
    const published = await take(assigned.snapshot, "publish", administrator);
    expect(published.result.codes.map((code) => code.key)).toEqual(["BE09999"]);
    expect(published.snapshot.codes.map((code) => code.key)).toEqual([
      "BE09999",
    ]);
  });
});
