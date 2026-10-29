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

import type { DetailsKind } from "../../detailsKinds";
import type { CheckResult, ChecklistItemId } from "./checklist";
import type { CodeType, RequestOperation } from "./codeTypes";
import type { RejectionGround } from "./rejectionGrounds";
import type { Actor } from "./roles";
import type { StakeholderCategory } from "./stakeholderCategories";
import type { WorkflowAction } from "../workflow/actions";

/** Where a request stands; see workflow/transitions.ts for the moves. */
export type RequestStatus =
  | "submitted"
  | "registered"
  | "informationRequested"
  | "rinfHarmonisation"
  | "externalCoordination"
  | "awaitingDecision"
  | "assigned"
  | "published"
  | "rejected"
  | "closed"
  | "underReview";

/** An OP or a section of line, or an asset (track, platform edge, …) of one. */
export type RinfLinkKind = DetailsKind | "asset";

/** The OP or section of line an asset belongs to. */
export interface RinfLinkParent {
  kind: DetailsKind;
  canonicalId: string;
  label: string;
}

/** The RINF element a code is positioned on. */
export interface RinfLink {
  kind: RinfLinkKind;
  /** OP or section of line: its canonical id (BELGB). Asset: its canonical URI. */
  canonicalId: string;
  label: string;
  /** Asset: what it is, e.g. "Running track". */
  assetClass?: string;
  /** Asset: the OP or section of line it is part of. */
  parent?: RinfLinkParent;
}

export interface Requester {
  name: string;
  organisation: string;
  /** Four-character organisation code (TD 103 chapter 5). */
  organisationCode: string;
  category: StakeholderCategory | "";
  email: string;
}

/** What the requester submits (TD 105 data elements, as far as used here). */
export interface RequestData {
  operation: RequestOperation;
  codeType: CodeType;
  /** Country prefix, e.g. "BE". */
  country: string;
  /** Proposed value; blank lets the Agency assign one (procedure 8.3). */
  proposedCode: string;
  /** Amendment or deactivation: the code concerned (PLC, or SLC value). */
  targetCode: string;
  locationName: string;
  /** PLC: organisation code of the IM of the operating site (procedure 9). */
  imOrganisationCode: string;
  /** PLC: the OP or section of line it is positioned on. SLC: optionally
   *  the OP, section of line or asset (track, platform edge, …) it is. */
  rinfLink: RinfLink | null;
  /** SLC: the parent PLC. */
  parentPrimaryCode: string;
  /** SLC: type code from TD 103, Table 6. */
  subsidiaryTypeCode: string;
  /** Amendment or deactivation: when it takes effect (YYYY-MM-DD). */
  effectiveDate: string;
  /** Closing a PLC: close its active SLCs in the same operation. */
  closeDependentCodes: boolean;
  /** Code in a legacy range of an international organisation (10.3). */
  legacyCodingRange: boolean;
  justification: string;
  language: string;
  requester: Requester;
  /** The requester checked the location reference file first (step 1). */
  preSubmissionConfirmed: boolean;
}

export interface RequestEvent {
  at: string;
  actor: Actor;
  action: WorkflowAction;
  note: string;
}

/** A period the deadline clock stood still: a request for information. */
export interface Suspension {
  from: string;
  to: string | null;
}

export interface Recommendation {
  outcome: "assign" | "reject";
  ground: RejectionGround | null;
}

export interface RinfPosition {
  outcome: "confirmed" | "notOnNetwork" | "inherited";
  link: RinfLink | null;
  by: Actor;
  at: string;
}

export interface Coordination {
  outcome: "confirmed" | "notSecured";
  organisation: string;
  by: Actor;
  at: string;
}

export interface Decision {
  outcome: "assign" | "reject";
  ground: RejectionGround | null;
  provision: string;
  /** The code value assigned or changed; null for a rejection. */
  code: string | null;
  note: string;
  by: Actor;
  at: string;
}

export interface Review {
  askedAt: string;
  reasons: string;
  outcome: "upheld" | "revised" | null;
  originalDecision: Decision;
  by: Actor | null;
}

/** The request file of procedure section 13. */
export interface LocationCodeRequest {
  id: string;
  /** Unique reference given at registration, e.g. "LC-2026-0001". */
  reference: string | null;
  status: RequestStatus;
  data: RequestData;
  submittedAt: string;
  submittedBy: string;
  /** T0 of section 11. */
  registeredAt: string | null;
  suspensions: Suspension[];
  checks: CheckResult[];
  checksRunAt: string | null;
  /** Value the checks found assignable: the proposed one if free, else the lowest free. */
  assignableCode: string | null;
  /** Manual checks the code administrator confirmed. */
  confirmedChecks: ChecklistItemId[];
  recommendation: Recommendation | null;
  rinfPosition: RinfPosition | null;
  coordination: Coordination | null;
  decision: Decision | null;
  publishedAt: string | null;
  notifiedAt: string | null;
  review: Review | null;
  events: RequestEvent[];
}
