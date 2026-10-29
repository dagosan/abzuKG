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

import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import { DEFAULT_REQUEST_LANGUAGE } from "../model/languages";
import type { Actor } from "../model/roles";

const REFERENCE_PREFIX = "LC";
const REFERENCE_DIGITS = 4;

/** An empty request form. */
export const emptyRequestData = (): RequestData => ({
  operation: "newCode",
  codeType: "primary",
  country: "",
  proposedCode: "",
  targetCode: "",
  locationName: "",
  imOrganisationCode: "",
  rinfLink: null,
  parentPrimaryCode: "",
  subsidiaryTypeCode: "",
  effectiveDate: "",
  closeDependentCodes: false,
  legacyCodingRange: false,
  justification: "",
  language: DEFAULT_REQUEST_LANGUAGE,
  requester: {
    name: "",
    organisation: "",
    organisationCode: "",
    category: "",
    email: "",
  },
  preSubmissionConfirmed: false,
});

/** A request as submitted (procedure step 2), before registration. */
export const createRequest = (
  id: string,
  data: RequestData,
  actor: Actor,
  now: string,
): LocationCodeRequest => ({
  id,
  reference: null,
  status: "submitted",
  data,
  submittedAt: now,
  submittedBy: actor.name,
  registeredAt: null,
  suspensions: [],
  checks: [],
  checksRunAt: null,
  assignableCode: null,
  confirmedChecks: [],
  recommendation: null,
  rinfPosition: null,
  coordination: null,
  decision: null,
  publishedAt: null,
  notifiedAt: null,
  review: null,
  events: [{ at: now, actor, action: "submit", note: "" }],
});

/** Reference given at registration, e.g. "LC-2026-0007". */
export const formatReference = (year: number, sequence: number): string =>
  `${REFERENCE_PREFIX}-${year}-${String(sequence).padStart(REFERENCE_DIGITS, "0")}`;
