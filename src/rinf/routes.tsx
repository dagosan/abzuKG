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

import { Route } from "react-router-dom";
import {
  CANONICAL_ID_PARAM,
  DETAILS_KIND_NAMES,
  DETAILS_KINDS,
} from "./detailsKinds";
import { DetailsPage } from "./pages/DetailsPage";

/**
 * The RINF routes, e.g. /operational-point/:canonicalId. A function, not a
 * component, because <Routes> only accepts <Route> elements as children:
 * App.tsx calls it inside its <Routes> with `{rinfRoutes(path)}`.
 */
export const rinfRoutes = (basePath: string) =>
  DETAILS_KIND_NAMES.map((kind) => (
    <Route
      key={kind}
      path={`${basePath}${DETAILS_KINDS[kind].route}/:${CANONICAL_ID_PARAM}`}
      element={<DetailsPage key={kind} kind={kind} />}
    />
  ));
