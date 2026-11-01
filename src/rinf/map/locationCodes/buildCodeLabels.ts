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

Added for the ERA RINF frontend, 2026-11-01.
Modified 2026-11-02: register as code versions with CRD's columns. */

import type { CodeVersion } from "../../locationCodes/model/CodeVersion";
import { elementOfLink } from "../../locationCodes/model/rinfLink";
import { anchorKey, CodeLabelAnchor } from "./codeLabelAnchors";
import type { CodeLabel, CodeLabelChip } from "./codeLabelTypes";

/** Keys of the visible elements that carry `code` in RINF. */
const anchorsCarrying = (
  code: string,
  anchors: Map<string, CodeLabelAnchor>,
): string[] =>
  [...anchors.entries()]
    .filter(([, anchor]) => anchor.rinfCodes.includes(code))
    .map(([key]) => key);

/** Visible element the register links `code` to; null when none is linked. */
const linkedAnchor = (
  code: CodeVersion,
  anchors: Map<string, CodeLabelAnchor>,
): string[] | null => {
  const element = code.rinfLink ? elementOfLink(code.rinfLink) : null;
  if (!element) return null;
  const key = anchorKey(element.kind, element.canonicalId);
  return anchors.has(key) ? [key] : [];
};

/**
 * Where a register code is drawn: on its linked RINF element (an asset's
 * OP or SoL); else a subsidiary code goes with its parent PLC, and a PLC
 * with no link goes on the elements that carry it in RINF.
 */
const placesOf = (
  code: CodeVersion,
  register: CodeVersion[],
  anchors: Map<string, CodeLabelAnchor>,
): string[] => {
  const linked = linkedAnchor(code, anchors);
  if (linked) return linked;
  if (code.codeType === "primary") return anchorsCarrying(code.code, anchors);
  const parent = register.find(
    (other) =>
      other.codeType === "primary" && other.code === code.parentPrimaryCode,
  );
  const parentLinked = parent ? linkedAnchor(parent, anchors) : null;
  return parentLinked ?? anchorsCarrying(code.parentPrimaryCode ?? "", anchors);
};

const registerChip = (
  code: CodeVersion,
  anchor: CodeLabelAnchor,
): CodeLabelChip => ({
  text: code.key,
  source:
    code.codeType === "primary" && anchor.rinfCodes.includes(code.code)
      ? "registerAndRinf"
      : "register",
});

/** PLCs before their SLCs, then in code order. */
const byCode = (first: CodeLabelChip, second: CodeLabelChip): number =>
  first.text.localeCompare(second.text);

/**
 * The code labels for the elements in view: each code RINF gives an element,
 * and each code the register holds for it, the two merged when both have it.
 * `register` holds only codes in force.
 */
export const buildCodeLabels = (
  anchors: Map<string, CodeLabelAnchor>,
  register: CodeVersion[],
): CodeLabel[] => {
  const registerChips = new Map<string, CodeLabelChip[]>();
  register.forEach((code) =>
    placesOf(code, register, anchors).forEach((key) => {
      const anchor = anchors.get(key);
      if (!anchor) return;
      registerChips.set(key, [
        ...(registerChips.get(key) ?? []),
        registerChip(code, anchor),
      ]);
    }),
  );

  return [...anchors.entries()]
    .map(([key, { kind, canonicalId, lat, lng, rinfCodes }]) => {
      const fromRegister = registerChips.get(key) ?? [];
      const inRegister = new Set(fromRegister.map((chip) => chip.text));
      const rinfOnly: CodeLabelChip[] = rinfCodes
        .filter((code) => !inRegister.has(code))
        .map((text) => ({ text, source: "rinf" }));
      const chips = [...rinfOnly, ...fromRegister].sort(byCode);
      return { kind, canonicalId, lat, lng, chips };
    })
    .filter((label) => label.chips.length > 0);
};
