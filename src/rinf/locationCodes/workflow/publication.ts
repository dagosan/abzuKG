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

Added for the ERA RINF frontend, 2026-11-02.
Modified 2026-11-02: register as code versions with CRD's columns. */

import { normalisePrimaryCode } from "../model/codeFormat";
import { isCreation } from "../model/codeTypes";
import type { CodeVersion } from "../model/CodeVersion";
import { currentVersions, isOpenOn } from "../model/codeVersions";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import {
  endedVersion,
  keyOf,
  openedVersion,
  versionFromKg,
} from "./codeVersionChanges";
import { isoDateOf } from "./workingDays";

/** Text key of the refusal when a change cannot apply to the code's current version. */
export const EFFECTIVE_DATE_REFUSAL = "rinf_lc_blocked_effective_date";

/**
 * A change applies to the current version: it must still be open, and the
 * new version must start after it did (CRD versions do not overlap).
 */
const requireChangeable = (current: CodeVersion, effectiveDate: string) => {
  const startsLater =
    current.startValidity === null || effectiveDate > current.startValidity;
  if (current.endedBy !== null || !startsLater)
    throw new Error(EFFECTIVE_DATE_REFUSAL);
};

/**
 * The register versions a published decision creates or changes (step 7).
 * A new code gets version 1. An amendment ends the current version the day
 * before its effective date and opens the next; a deactivation ends it.
 * Closing a PLC also closes its dependent SLCs, from the register and the KG
 * (`kgSubsidiaryCodes`), when the request asks for it (procedure 9).
 */
export const registerChanges = (
  request: LocationCodeRequest,
  register: CodeVersion[],
  kgSubsidiaryCodes: string[],
  now: string,
): CodeVersion[] => {
  const code = request.decision?.code;
  if (!code) return [];
  const { data } = request;
  if (isCreation(data.operation)) {
    const base = versionFromKg(request, code, now);
    return [openedVersion(request, base, null, isoDateOf(now), now)];
  }
  const key = keyOf(request, code);
  const current =
    currentVersions(register).find((version) => version.key === key) ??
    versionFromKg(request, code, now);
  requireChangeable(current, data.effectiveDate);
  if (data.operation === "amendment")
    return [
      endedVersion(request, current, data.effectiveDate, "amended", now),
      openedVersion(request, current, current, data.effectiveDate, now),
    ];
  const closed = endedVersion(
    request,
    current,
    data.effectiveDate,
    "closed",
    now,
  );
  if (data.codeType === "subsidiary" || !data.closeDependentCodes)
    return [closed];
  return [closed, ...dependants(request, register, kgSubsidiaryCodes, now)];
};

const dependants = (
  request: LocationCodeRequest,
  register: CodeVersion[],
  kgSubsidiaryCodes: string[],
  now: string,
): CodeVersion[] => {
  const parent = normalisePrimaryCode(request.data.targetCode);
  const today = isoDateOf(now);
  const subsidiaryRequest: LocationCodeRequest = {
    ...request,
    data: {
      ...request.data,
      codeType: "subsidiary",
      parentPrimaryCode: parent,
    },
  };
  const subsidiaries = currentVersions(register).filter(
    (version) =>
      version.codeType === "subsidiary" && version.parentPrimaryCode === parent,
  );
  const known = new Set(subsidiaries.map((version) => version.code));
  const fromKg = kgSubsidiaryCodes
    .filter((value) => !known.has(value))
    .map((value) => versionFromKg(subsidiaryRequest, value, now));
  return [
    ...subsidiaries.filter(
      (version) => version.endedBy === null && isOpenOn(version, today),
    ),
    ...fromKg,
  ].map((version) =>
    endedVersion(request, version, request.data.effectiveDate, "closed", now),
  );
};
