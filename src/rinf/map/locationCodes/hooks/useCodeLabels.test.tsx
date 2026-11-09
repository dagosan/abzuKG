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

Added for the ERA RINF frontend, 2026-11-05. */

import { configureStore } from "@reduxjs/toolkit";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { locationCodeStore } from "../../../locationCodes/store/activeStore";
import { LOGIN_REQUIRED_ERROR } from "../../../locationCodes/store/storeErrors";
import { rinfReducer } from "../../../state/rinfReducer";
import { useCodeLabels } from "./useCodeLabels";

vi.mock("../../../locationCodes/store/activeStore", () => ({
  locationCodeStore: { loadRequests: vi.fn(), loadCodes: vi.fn() },
}));

const loadRequests = vi.mocked(locationCodeStore.loadRequests);
const loadCodes = vi.mocked(locationCodeStore.loadCodes);

const renderLabels = () => {
  const store = configureStore({ reducer: { rinf: rinfReducer } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const twoLayers = () => [useCodeLabels(true), useCodeLabels(true)];
  return { store, ...renderHook(twoLayers, { wrapper }) };
};

describe("useCodeLabels", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // As on the NAS with nobody logged in: the requests are refused.
    loadRequests.mockRejectedValue(new Error(LOGIN_REQUIRED_ERROR));
  });

  it("reads the register once, never the requests, and reports no failure", async () => {
    loadCodes.mockResolvedValue([]);
    const { store, result } = renderLabels();

    await waitFor(() =>
      expect(store.getState().rinf.locationCodes.codesLoadStatus).toBe(
        "loaded",
      ),
    );

    expect(loadCodes).toHaveBeenCalledTimes(1);
    expect(loadRequests).not.toHaveBeenCalled();
    expect(result.current[0].registerUnavailable).toBe(false);
  });

  it("says so when the register really can't be read", async () => {
    loadCodes.mockRejectedValue(new Error("down"));
    const { result } = renderLabels();

    await waitFor(() =>
      expect(result.current[0].registerUnavailable).toBe(true),
    );
  });
});
