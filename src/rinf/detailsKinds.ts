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

import { ERA_NAMESPACE } from "./api/queryParts";
import { sectionOfLineName, stripValidity } from "./models/labels";

/** The RINF elements that open in the details panel. */
export type DetailsKind = "sectionOfLine" | "operationalPoint";

export interface DetailsKindConfig {
  /** Route segment: /<route>/:canonicalId. */
  route: string;
  /** Canonical URIs are this prefix plus the id shown in the page URL. */
  canonicalPrefix: string;
  /** Text keys for the panel's overline and its "not found" message. */
  titleId: string;
  notFoundId: string;
  /** Statements not listed as parameters for this kind. */
  hiddenProperties: string[];
  /** Short display name from the element's label. */
  displayName: (label: string) => string;
}

export const DETAILS_KINDS: Record<DetailsKind, DetailsKindConfig> = {
  sectionOfLine: {
    route: "section-of-line",
    canonicalPrefix: `${ERA_NAMESPACE}sectionOfLine/`,
    titleId: "rinf_section_of_line",
    notFoundId: "rinf_section_of_line_not_found",
    // A SoL's net reference is only its drawn shape.
    hiddenProperties: [`${ERA_NAMESPACE}netReference`],
    displayName: sectionOfLineName,
  },
  operationalPoint: {
    route: "operational-point",
    canonicalPrefix: `${ERA_NAMESPACE}operationalPoint/`,
    titleId: "rinf_operational_point",
    notFoundId: "rinf_operational_point_not_found",
    // An OP's net references are its railway locations (km on each line): kept.
    hiddenProperties: [],
    displayName: stripValidity,
  },
};

export const DETAILS_KIND_NAMES = Object.keys(DETAILS_KINDS) as DetailsKind[];

/** Route parameter holding the canonical id. */
export const CANONICAL_ID_PARAM = "canonicalId";

/** The id after the kind's prefix, or null when the URI is of another kind. */
export const canonicalIdFromUri = (
  kind: DetailsKind,
  uri: string,
): string | null => {
  const { canonicalPrefix } = DETAILS_KINDS[kind];
  return uri.startsWith(canonicalPrefix)
    ? uri.slice(canonicalPrefix.length) || null
    : null;
};

/** Path that opens the panel, e.g. /operational-point/BELGB. */
export const detailsPath = (kind: DetailsKind, canonicalId: string): string =>
  `/${DETAILS_KINDS[kind].route}/${encodeURIComponent(canonicalId)}`;
