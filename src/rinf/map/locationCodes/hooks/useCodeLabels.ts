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

Added for the ERA RINF frontend, 2026-11-01.
Modified 2026-11-05: reads the public register alone, never the requests. */

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { todayIsoDate } from "../../../api/queryParts";
import { isActiveOn } from "../../../locationCodes/model/RegisteredCode";
import { loadRegisterCodes } from "../../../locationCodes/state/locationCodesThunks";
import { buildCodeLabelAnchors } from "../codeLabelAnchors";
import { buildCodeLabels } from "../buildCodeLabels";
import type { CodeLabel } from "../codeLabelTypes";

export interface CodeLabels {
  labels: CodeLabel[];
  /** The register could not be read, so only RINF's codes are shown. */
  registerUnavailable: boolean;
}

/**
 * Code labels for the OPs and SoLs in view. Loads the register once when
 * `enabled` (it is otherwise loaded only on the Location codes tab). Only the
 * codes: the requests need a login, and the map is open to everyone.
 */
export const useCodeLabels = (enabled: boolean): CodeLabels => {
  const dispatch = useAppDispatch();
  const operationalPoints = useAppSelector(
    (state) => state.rinf.operationalPoints.items,
  );
  const sectionsOfLine = useAppSelector(
    (state) => state.rinf.sectionsOfLine.items,
  );
  const { codes, codesLoadStatus } = useAppSelector(
    (state) => state.rinf.locationCodes,
  );

  useEffect(() => {
    if (enabled && codesLoadStatus === "idle") dispatch(loadRegisterCodes());
  }, [enabled, codesLoadStatus, dispatch]);

  const labels = useMemo(() => {
    if (!enabled) return [];
    const today = todayIsoDate();
    const inForce = codes.filter((code) => isActiveOn(code, today));
    const anchors = buildCodeLabelAnchors(operationalPoints, sectionsOfLine);
    return buildCodeLabels(anchors, inForce);
  }, [enabled, codes, operationalPoints, sectionsOfLine]);

  return { labels, registerUnavailable: codesLoadStatus === "failed" };
};
