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

import { createAsyncThunk } from "@reduxjs/toolkit";
import { buildParameterSearchQuery } from "../api/parameterSearchQuery";
import { todayIsoDate } from "../api/queryParts";
import { runSparqlSelect } from "../api/sparqlClient";
import {
  CarrierType,
  distinctAttachments,
} from "../models/parameterAttachments";
import type { ParameterCriteria } from "../models/parameterCriteria";
import { PlaceMatch, toPlaceMatches } from "../models/parameterMatches";
import { datasetsToSearch, ScopeOptions } from "../models/scopeOptions";

/** Places listed and highlighted at most; more is flagged as "and more". */
export const PLACE_MATCHES_LIMIT = 5000;

interface ParameterSearchArgs {
  endpoint: string;
  criteria: ParameterCriteria;
  carriers: CarrierType[];
  scopeOptions: ScopeOptions;
}

export const runParameterSearch = createAsyncThunk<
  PlaceMatch[],
  ParameterSearchArgs
>(
  "rinf/runParameterSearch",
  async ({ endpoint, criteria, carriers, scopeOptions }, { signal }) => {
    const attachments = distinctAttachments(carriers);
    if (attachments.length === 0) return [];
    const query = buildParameterSearchQuery(
      criteria,
      attachments,
      datasetsToSearch(
        scopeOptions,
        criteria.countries,
        criteria.infrastructureManagers,
      ),
      PLACE_MATCHES_LIMIT,
      todayIsoDate(),
    );
    return toPlaceMatches(await runSparqlSelect(endpoint, query, signal));
  },
);
