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

import { ERA_NAMESPACE } from "../api/queryParts";
import type { SparqlBinding } from "../api/sparqlClient";

/**
 * How elements carrying a parameter connect to a section of line or OP:
 * they are one ("itself"), part of one ("partOf", e.g. a track), linked from
 * one ("fromPlace", e.g. an OP's primary location), or linked from a track
 * that is part of one ("viaTrack", e.g. a contact line system).
 */
export type Attachment =
  | { how: "itself" }
  | { how: "partOf" }
  | { how: "fromPlace"; link: string }
  | { how: "viaTrack"; link: string };

const LINKED_HOWS = new Set(["fromPlace", "viaTrack"]);

/** An element type that carries the parameter, how many of them, and how they attach. */
export interface CarrierType {
  typeUri: string;
  elements: number;
  attachment: Attachment | null;
}

const PLACE_TYPES = new Set(
  ["SectionOfLine", "OperationalPoint"].map(
    (name) => `${ERA_NAMESPACE}${name}`,
  ),
);

export const isPlaceType = (typeUri: string): boolean =>
  PLACE_TYPES.has(typeUri);

export const toCarrierTypes = (bindings: SparqlBinding[]): CarrierType[] =>
  bindings
    .filter((binding) => binding.type?.value)
    .map(({ type, elements }) => ({
      typeUri: type!.value,
      elements: Number.parseInt(elements?.value ?? "0", 10),
      attachment: isPlaceType(type!.value) ? { how: "itself" } : null,
    }));

/** The most common attachment in a probe's rows; null when none reaches a place. */
export const toAttachment = (bindings: SparqlBinding[]): Attachment | null => {
  const [best] = bindings
    .filter((binding) => binding.how?.value)
    .sort(
      (first, second) =>
        Number(second.sampled?.value ?? 0) - Number(first.sampled?.value ?? 0),
    );
  if (!best) return null;
  const how = best.how!.value;
  if (how === "partOf") return { how: "partOf" };
  if (!LINKED_HOWS.has(how) || !best.link?.value) return null;
  return { how: how as "fromPlace" | "viaTrack", link: best.link.value };
};

/** The distinct ways to reach a place, so each is searched once. */
export const distinctAttachments = (types: CarrierType[]): Attachment[] => {
  const seen = new Map<string, Attachment>();
  types.forEach(({ attachment }) => {
    if (!attachment) return;
    const key =
      "link" in attachment
        ? `${attachment.how}:${attachment.link}`
        : attachment.how;
    seen.set(key, attachment);
  });
  return [...seen.values()];
};
