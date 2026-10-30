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
import { toolFeatures } from "../rinf/config/rinfTool";

describe("toolFeatures", () => {
  it("gives the RINF viewer its reports and no location codes", () => {
    expect(toolFeatures("rinf-viewer")).toEqual({
      tool: "rinf-viewer",
      rinfReports: true,
      locationCodes: false,
      titleId: "rinf_tool_title_rinf_viewer",
    });
  });

  it("gives the Location Code Manager its codes and no RINF reports", () => {
    expect(toolFeatures("location-code-manager")).toMatchObject({
      rinfReports: false,
      locationCodes: true,
      titleId: "_title",
    });
  });

  it("shows both tools when the setting is missing or unknown", () => {
    for (const value of [undefined, "", "rinf viewer"]) {
      expect(toolFeatures(value)).toMatchObject({
        tool: null,
        rinfReports: true,
        locationCodes: true,
      });
    }
  });
});
