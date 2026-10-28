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

Added for the ERA RINF frontend, 2026-10-28. */

import { useContext } from "react";
import { ConfigContext } from "../../config/ConfigContext";

/** ERA's public GraphDB repository behind rinf.data.era.europa.eu. */
export const DEFAULT_RINF_SPARQL_ENDPOINT =
  "https://graph.data.era.europa.eu/repositories/rinf-plus";

/** The endpoint from bootstrap.json (`rinfSparqlEndpoint`), else ERA's public one. */
export const useRinfSparqlEndpoint = (): string => {
  const { rinfSparqlEndpoint } = useContext(ConfigContext);
  return rinfSparqlEndpoint || DEFAULT_RINF_SPARQL_ENDPOINT;
};
