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

import { useContext } from "react";
import { ConfigContext } from "../../config/ConfigContext";

/**
 * The two tools one deployment can be, chosen with `rinfTool` in
 * bootstrap.json. They share the map, the details panel and the search;
 * each adds its own pages.
 */
export const RINF_TOOLS = ["rinf-viewer", "location-code-manager"] as const;
export type RinfTool = (typeof RINF_TOOLS)[number];

export interface RinfToolFeatures {
  /** Unset `rinfTool` means both, as during development. */
  tool: RinfTool | null;
  /** RINF reports (search by parameter) and showing their results on the map. */
  rinfReports: boolean;
  /** The location code workflow, its register and picking RINF elements for it. */
  locationCodes: boolean;
  /** Text key of the application's name in the header and browser tab. */
  titleId: string;
}

const TITLE_IDS: Record<RinfTool, string> = {
  "rinf-viewer": "rinf_tool_title_rinf_viewer",
  "location-code-manager": "_title",
};
const BOTH_TOOLS_TITLE_ID = "_title";

/** What a `rinfTool` value turns on; an unknown or missing value turns on both. */
export const toolFeatures = (value: string | undefined): RinfToolFeatures => {
  const tool = RINF_TOOLS.find((known) => known === value) ?? null;
  return {
    tool,
    rinfReports: tool !== "location-code-manager",
    locationCodes: tool !== "rinf-viewer",
    titleId: tool ? TITLE_IDS[tool] : BOTH_TOOLS_TITLE_ID,
  };
};

/** The features of this deployment's tool. */
export const useRinfTool = (): RinfToolFeatures =>
  toolFeatures(useContext(ConfigContext).rinfTool);
