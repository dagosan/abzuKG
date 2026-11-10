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
import type { Actor } from "../model/roles";
import { emptyRequestData } from "../workflow/createRequest";
import { browserStore } from "./browserStore";

const anna: Actor = { name: "Anna", role: "requester" };
const data = { ...emptyRequestData(), country: "BE", locationName: "X" };

afterEach(() => window.localStorage.clear());

describe("drafts in the browser store", () => {
  it("keeps a draft for its owner and saves it again in place", async () => {
    await browserStore.saveDraft("d1", data, "Anna");
    await browserStore.saveDraft("d2", data, "Ben");
    await browserStore.saveDraft(
      "d1",
      { ...data, locationName: "Y" },
      " anna ",
    );
    const drafts = await browserStore.loadDrafts("Anna");
    expect(drafts.map((draft) => draft.id)).toEqual(["d1"]);
    expect(drafts[0].data.locationName).toBe("Y");
    expect(await browserStore.loadDrafts("Ben")).toHaveLength(1);
  });

  it("discards only the owner's own draft", async () => {
    await browserStore.saveDraft("d1", data, "Anna");
    await browserStore.deleteDraft("d1", "Ben");
    expect(await browserStore.loadDrafts("Anna")).toHaveLength(1);
    await browserStore.deleteDraft("d1", "Anna");
    expect(await browserStore.loadDrafts("Anna")).toHaveLength(0);
  });

  it("removes the draft a request was submitted from", async () => {
    await browserStore.saveDraft("d1", data, "Anna");
    await browserStore.saveDraft("d2", data, "Anna");
    const request = await browserStore.submitRequest(data, anna, "d1");
    expect(request.status).toBe("submitted");
    expect(
      (await browserStore.loadDrafts("Anna")).map((draft) => draft.id),
    ).toEqual(["d2"]);
  });
});
