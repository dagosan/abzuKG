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

import { ERA_NAMESPACE } from "../../api/queryParts";
import { detailsPath, DetailsKind } from "../../detailsKinds";
import type { RinfLink, RinfLinkParent } from "./LocationCodeRequest";

/**
 * RINF classes that are places an SLC can identify: TD 103 Table 6 has
 * track (01), platform (15), tunnel (24), signal (27), switch (10) and
 * sidings (06, 07). Other linked objects (ETCS, contact line…) are not.
 */
export const LOCATION_ASSET_CLASSES = [
  "RunningTrack",
  "Siding",
  "PlatformEdge",
  "Tunnel",
  "Signal",
  "Switch",
].map((name) => `${ERA_NAMESPACE}${name}`);

export const isLocationAssetClass = (classUri: string | null): boolean =>
  classUri !== null && LOCATION_ASSET_CLASSES.includes(classUri);

/** The OP or section of line of a link: itself, or an asset's parent. */
export const elementOfLink = (link: RinfLink): RinfLinkParent | null => {
  if (link.kind !== "asset")
    return {
      kind: link.kind,
      canonicalId: link.canonicalId,
      label: link.label,
    };
  return link.parent ?? null;
};

/** Where the link opens on the map: the element's panel, or its parent's. */
export const rinfLinkPath = (link: RinfLink): string | null => {
  const element = elementOfLink(link);
  return element ? detailsPath(element.kind, element.canonicalId) : null;
};

/** "Gembloux · BELGB", or "Running track Gembloux voie III · in Gembloux". */
export const rinfLinkText = (link: RinfLink): string => {
  if (link.kind !== "asset") return `${link.label} · ${link.canonicalId}`;
  const what = [link.assetClass, link.label].filter(Boolean).join(" ");
  return link.parent ? `${what} · ${link.parent.label}` : what;
};

/** A link to an OP or section of line. */
export const elementLink = (
  kind: DetailsKind,
  canonicalId: string,
  label: string,
): RinfLink => ({ kind, canonicalId, label });
