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

import type { CheckResult } from "../model/checklist";
import type {
  LocationCodeRequest,
  RinfLink,
} from "../model/LocationCodeRequest";
import { isActiveOn, RegisteredCode } from "../model/RegisteredCode";
import type { KgElement, KgPrimaryLocation } from "./kgLookups";

/** What the technical checks need to know, gathered before they run. */
export interface CheckContext {
  today: string;
  /** PLC creation: every code with the country prefix in the KG. */
  kgCountryCodes: string[];
  /** PLC creation with a proposed value: that value in the KG. */
  kgProposedCode: KgPrimaryLocation | null;
  /** SLC: the parent PLC; PLC change: the target PLC; in the KG. */
  kgPrimaryCode: KgPrimaryLocation | null;
  /** SLCs the KG links to the parent (SLC) or target (PLC closure). */
  kgSubsidiaryCodes: string[];
  /** PLC: the RINF element the request positions the code on. */
  rinfElement: KgElement | null;
  /** Codes recorded by this workflow. */
  register: RegisteredCode[];
  /** Other requests still being handled. */
  otherOpenRequests: LocationCodeRequest[];
}

export const sameLink = (
  first: RinfLink | null,
  second: RinfLink | null,
): boolean =>
  Boolean(first && second) &&
  first?.kind === second?.kind &&
  first?.canonicalId === second?.canonicalId;

/** Primary codes in the register, active or not: codes are never reused. */
export const registeredPrimaryCodes = (register: RegisteredCode[]) =>
  register.filter((code) => code.codeType === "primary");

/** Active subsidiary codes in the register under `parent`. */
export const activeSubsidiariesOf = (
  register: RegisteredCode[],
  parent: string,
  today: string,
): RegisteredCode[] =>
  register.filter(
    (code) =>
      code.codeType === "subsidiary" &&
      code.parentPrimaryCode === parent &&
      isActiveOn(code, today),
  );

/** Every subsidiary code value under `parent`, register and KG, any state. */
export const subsidiaryValuesOf = (
  context: CheckContext,
  parent: string,
): string[] => [
  ...context.kgSubsidiaryCodes,
  ...context.register
    .filter(
      (code) =>
        code.codeType === "subsidiary" && code.parentPrimaryCode === parent,
    )
    .map((code) => code.code),
];

export const findRegistered = (
  register: RegisteredCode[],
  key: string,
): RegisteredCode | null => register.find((code) => code.key === key) ?? null;

/** One line of the checklist. */
export const checkResult = (
  item: CheckResult["item"],
  outcome: CheckResult["outcome"],
  detailId: string,
  values?: Record<string, string>,
): CheckResult => ({ item, outcome, detailId, values });
