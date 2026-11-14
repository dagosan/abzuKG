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

Added for the ERA Location Code Manager, 2026-11-14. */

import { describe, expect, it } from "vitest";
import changelog from "../../CHANGELOG.md?raw";
import { LOCATION_CODE_MANAGER_VERSION } from "./version";

/** A release heading: "## [0.9.0] - 2026-11-14". */
const RELEASE_HEADING = /^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}$/m;

describe("the Location Code Manager's version", () => {
  it("is the newest release in the change log", () => {
    const newest = RELEASE_HEADING.exec(changelog)?.[1];
    expect(newest).toBe(LOCATION_CODE_MANAGER_VERSION);
  });
});
