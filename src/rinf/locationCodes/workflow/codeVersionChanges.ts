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

Added for the ERA RINF frontend, 2026-11-02. */

import { asciiName } from "../model/asciiName";
import { normalisePrimaryCode, subsidiaryKey } from "../model/codeFormat";
import type {
  CodeChange,
  CodeVersion,
  VersionChange,
} from "../model/CodeVersion";
import { dayBefore } from "../model/codeVersions";
import { normaliseNutsCode, parseCoordinate } from "../model/crdValues";
import {
  CrdAttributes,
  crdOf,
  LocationCodeRequest,
} from "../model/LocationCodeRequest";

export const versionChange = (
  request: LocationCodeRequest,
  change: CodeChange,
  now: string,
): VersionChange => ({
  at: now,
  requestId: request.id,
  reference: request.reference,
  change,
});

export const keyOf = (request: LocationCodeRequest, code: string): string => {
  const { data } = request;
  return data.codeType === "primary"
    ? normalisePrimaryCode(code)
    : subsidiaryKey(data.parentPrimaryCode, code);
};

/** A blank version 1 of a code the register knows only from the KG, so it can end. */
export const versionFromKg = (
  request: LocationCodeRequest,
  code: string,
  now: string,
): CodeVersion => {
  const { data } = request;
  const isPrimary = data.codeType === "primary";
  const parent = isPrimary
    ? null
    : normalisePrimaryCode(data.parentPrimaryCode);
  return {
    key: keyOf(request, code),
    version: 1,
    codeType: data.codeType,
    code,
    parentPrimaryCode: parent,
    subsidiaryTypeCode: "",
    countryIsoCode: (parent ?? code).slice(0, 2),
    startValidity: null,
    endValidity: null,
    responsibleImCode: "",
    locationName: "",
    locationNameAscii: "",
    nutsCode: "",
    containerHandlingFlag: false,
    handoverPointFlag: false,
    freightPossibleFlag: false,
    freightStartValidity: null,
    freightEndValidity: null,
    passengerPossibleFlag: false,
    passengerStartValidity: null,
    passengerEndValidity: null,
    latitude: null,
    longitude: null,
    freeText: "",
    addDate: now,
    modDate: now,
    rinfLink: null,
    openedBy: null,
    endedBy: null,
  };
};

/** Start of a use (freight or passenger): kept while it goes on, today's when it begins. */
const useStart = (
  possible: boolean,
  wasPossible: boolean,
  previousStart: string | null,
  start: string,
): string | null => {
  if (!possible) return null;
  return wasPossible ? (previousStart ?? start) : start;
};

const textOr = (value: string, fallback: string): string =>
  value.trim() === "" ? fallback : value.trim();

/**
 * The version a request opens: the first (creation) or the next after
 * `previous` (amendment). Blank text and unset flags keep the previous
 * values; validity starts on `start`.
 */
export const openedVersion = (
  request: LocationCodeRequest,
  base: CodeVersion,
  previous: CodeVersion | null,
  start: string,
  now: string,
): CodeVersion => {
  const { data } = request;
  const crd: CrdAttributes = crdOf(data);
  const name = textOr(data.locationName, base.locationName);
  const nameChanged = name !== base.locationName;
  const freight = crd.freightPossibleFlag ?? base.freightPossibleFlag;
  const passenger = crd.passengerPossibleFlag ?? base.passengerPossibleFlag;
  const latitude = parseCoordinate(crd.latitude);
  const longitude = parseCoordinate(crd.longitude);
  return {
    ...base,
    version: previous ? previous.version + 1 : 1,
    subsidiaryTypeCode: textOr(
      data.subsidiaryTypeCode,
      base.subsidiaryTypeCode,
    ),
    startValidity: start,
    endValidity: null,
    responsibleImCode: textOr(
      data.imOrganisationCode.toUpperCase(),
      base.responsibleImCode,
    ),
    locationName: name,
    locationNameAscii: textOr(
      crd.locationNameAscii,
      nameChanged || !base.locationNameAscii
        ? asciiName(name)
        : base.locationNameAscii,
    ),
    nutsCode: textOr(normaliseNutsCode(crd.nutsCode), base.nutsCode),
    containerHandlingFlag:
      crd.containerHandlingFlag ?? base.containerHandlingFlag,
    handoverPointFlag: crd.handoverPointFlag ?? base.handoverPointFlag,
    freightPossibleFlag: freight,
    freightStartValidity: useStart(
      freight,
      Boolean(previous?.freightPossibleFlag),
      previous?.freightStartValidity ?? null,
      start,
    ),
    freightEndValidity: null,
    passengerPossibleFlag: passenger,
    passengerStartValidity: useStart(
      passenger,
      Boolean(previous?.passengerPossibleFlag),
      previous?.passengerStartValidity ?? null,
      start,
    ),
    passengerEndValidity: null,
    latitude: latitude ?? base.latitude,
    longitude: longitude ?? base.longitude,
    freeText: textOr(crd.freeText, base.freeText),
    addDate: now,
    modDate: now,
    rinfLink: data.rinfLink ?? base.rinfLink,
    openedBy: versionChange(request, previous ? "amended" : "assigned", now),
    endedBy: null,
  };
};

/** The version as it ends on `effectiveDate` (its last day is the day before). */
export const endedVersion = (
  request: LocationCodeRequest,
  version: CodeVersion,
  effectiveDate: string,
  change: CodeChange,
  now: string,
): CodeVersion => {
  const end = dayBefore(effectiveDate);
  const closing = change === "closed";
  return {
    ...version,
    endValidity: end,
    freightEndValidity:
      closing && version.freightPossibleFlag
        ? (version.freightEndValidity ?? end)
        : version.freightEndValidity,
    passengerEndValidity:
      closing && version.passengerPossibleFlag
        ? (version.passengerEndValidity ?? end)
        : version.passengerEndValidity,
    modDate: now,
    endedBy: versionChange(request, change, now),
  };
};
