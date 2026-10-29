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
import {
  buildAttachmentQuery,
  buildCarrierTypesQuery,
  buildScopeOptionsQuery,
  buildValuesInUseQuery,
} from "../api/parameterProfileQueries";
import { runSparqlSelect } from "../api/sparqlClient";
import {
  CarrierType,
  toAttachment,
  toCarrierTypes,
} from "../models/parameterAttachments";
import { toValuesInUse, ValueInUse } from "../models/parameterValues";
import { ScopeOptions, toScopeOptions } from "../models/scopeOptions";

/** Enough values for a dropdown; a parameter with more is searched by typing. */
export const VALUES_IN_USE_LIMIT = 200;

/** The countries and IMs to filter on; loaded once per session. */
export const fetchScopeOptions = createAsyncThunk<ScopeOptions, string>(
  "rinf/fetchScopeOptions",
  async (endpoint) =>
    toScopeOptions(await runSparqlSelect(endpoint, buildScopeOptionsQuery())),
);

interface CarrierTypesArgs {
  endpoint: string;
  property: string;
}

/**
 * Which element types carry the parameter and how each reaches a section of
 * line or OP — so the search follows only those links. Depends on the
 * parameter alone, so it is kept per parameter for the session.
 */
export const fetchCarrierTypes = createAsyncThunk<
  CarrierType[],
  CarrierTypesArgs
>("rinf/fetchCarrierTypes", async ({ endpoint, property }, { signal }) => {
  const carriers = toCarrierTypes(
    await runSparqlSelect(endpoint, buildCarrierTypesQuery(property), signal),
  );
  return Promise.all(
    carriers.map(async (carrier) =>
      carrier.attachment
        ? carrier
        : {
            ...carrier,
            attachment: toAttachment(
              await runSparqlSelect(
                endpoint,
                buildAttachmentQuery(property, carrier.typeUri),
                signal,
              ),
            ),
          },
    ),
  );
});

interface ValuesInUseArgs {
  endpoint: string;
  property: string;
  datasets: string[] | null;
}

/** The values a parameter takes within the chosen IMs, for the value dropdown. */
export const fetchValuesInUse = createAsyncThunk<ValueInUse[], ValuesInUseArgs>(
  "rinf/fetchValuesInUse",
  async ({ endpoint, property, datasets }, { signal }) =>
    toValuesInUse(
      await runSparqlSelect(
        endpoint,
        buildValuesInUseQuery(property, datasets, VALUES_IN_USE_LIMIT),
        signal,
      ),
    ),
);
