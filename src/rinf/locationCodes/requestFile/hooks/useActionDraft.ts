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

import { useMemo, useState } from "react";
import type {
  LocationCodeRequest,
  RinfLink,
} from "../../model/LocationCodeRequest";
import {
  GROUND_PROVISIONS,
  RejectionGround,
} from "../../model/rejectionGrounds";
import type { WorkflowAction } from "../../workflow/actions";
import type { ActionPayload } from "../../workflow/applyAction";
import { ACTION_FIELDS, NOTE_REQUIRED } from "../actionFields";

export interface ActionDraft {
  note: string;
  setNote: (note: string) => void;
  recommendation: "assign" | "reject";
  setRecommendation: (outcome: "assign" | "reject") => void;
  ground: RejectionGround | "";
  setGround: (ground: RejectionGround | "") => void;
  link: RinfLink | null;
  setLink: (link: RinfLink | null) => void;
  organisation: string;
  setOrganisation: (organisation: string) => void;
  /** The payload, or null while something required is missing. */
  payload: ActionPayload | null;
}

/** Recommend rejection when the checks found something fatal. */
const suggestedRecommendation = (request: LocationCodeRequest) =>
  request.checks.some((result) => result.outcome === "fail")
    ? "reject"
    : "assign";

/** The inputs of one action's dialog and the payload they make. */
export const useActionDraft = (
  request: LocationCodeRequest,
  action: WorkflowAction,
): ActionDraft => {
  const [note, setNote] = useState("");
  const [recommendation, setRecommendation] = useState<"assign" | "reject">(
    () => suggestedRecommendation(request),
  );
  const [ground, setGround] = useState<RejectionGround | "">("");
  const [link, setLink] = useState<RinfLink | null>(request.data.rinfLink);
  const [organisation, setOrganisation] = useState("");
  const fields = ACTION_FIELDS[action] ?? [];

  const payload = useMemo((): ActionPayload | null => {
    if (NOTE_REQUIRED.includes(action) && !note.trim()) return null;
    if (fields.includes("ground") && !ground) return null;
    if (fields.includes("rinfLink") && !link) return null;
    if (fields.includes("organisation") && !organisation.trim()) return null;
    const recommendsRejection = recommendation === "reject";
    if (fields.includes("recommendation") && recommendsRejection && !ground)
      return null;
    return {
      note,
      link,
      organisation,
      ...(ground && { ground, provision: GROUND_PROVISIONS[ground] }),
      ...(fields.includes("recommendation") && {
        recommendation: {
          outcome: recommendation,
          ground: recommendsRejection && ground ? ground : null,
        },
      }),
    };
  }, [action, fields, note, ground, link, organisation, recommendation]);

  return {
    note,
    setNote,
    recommendation,
    setRecommendation,
    ground,
    setGround,
    link,
    setLink,
    organisation,
    setOrganisation,
    payload,
  };
};
