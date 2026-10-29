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

import { normalisePrimaryCode, subsidiaryKey } from "../model/codeFormat";
import { isCreation } from "../model/codeTypes";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import {
  CodeChange,
  isActiveOn,
  RegisteredCode,
} from "../model/RegisteredCode";
import { isoDateOf } from "./workingDays";

const historyEntry = (
  request: LocationCodeRequest,
  change: CodeChange,
  now: string,
) => ({ at: now, requestId: request.id, reference: request.reference, change });

const keyOf = (request: LocationCodeRequest, code: string): string => {
  const { data } = request;
  return data.codeType === "primary"
    ? normalisePrimaryCode(code)
    : subsidiaryKey(data.parentPrimaryCode, code);
};

/** A register entry for a code known only from the KG, so it can change. */
const entryFromKg = (
  request: LocationCodeRequest,
  code: string,
): RegisteredCode => {
  const { data } = request;
  const isPrimary = data.codeType === "primary";
  return {
    key: keyOf(request, code),
    codeType: data.codeType,
    code,
    parentPrimaryCode: isPrimary
      ? null
      : normalisePrimaryCode(data.parentPrimaryCode),
    country: (isPrimary ? code : data.parentPrimaryCode).slice(0, 2),
    name: "",
    imOrganisationCode: "",
    subsidiaryTypeCode: "",
    rinfLink: null,
    validFrom: "",
    closedFrom: null,
    history: [],
  };
};

const createdEntry = (
  request: LocationCodeRequest,
  code: string,
  now: string,
): RegisteredCode => ({
  ...entryFromKg(request, code),
  name: request.data.locationName.trim(),
  imOrganisationCode: request.data.imOrganisationCode.trim().toUpperCase(),
  subsidiaryTypeCode: request.data.subsidiaryTypeCode,
  rinfLink: request.data.rinfLink,
  validFrom: isoDateOf(now),
  history: [historyEntry(request, "assigned", now)],
});

const amendedEntry = (
  request: LocationCodeRequest,
  entry: RegisteredCode,
  now: string,
): RegisteredCode => {
  const { data } = request;
  return {
    ...entry,
    name: data.locationName.trim() || entry.name,
    imOrganisationCode:
      data.imOrganisationCode.trim().toUpperCase() || entry.imOrganisationCode,
    rinfLink: data.rinfLink ?? entry.rinfLink,
    history: [...entry.history, historyEntry(request, "amended", now)],
  };
};

const closedEntry = (
  request: LocationCodeRequest,
  entry: RegisteredCode,
  now: string,
): RegisteredCode => ({
  ...entry,
  closedFrom: request.data.effectiveDate,
  history: [...entry.history, historyEntry(request, "closed", now)],
});

/**
 * The register entries a published decision creates or changes (step 7).
 * Closing a PLC also closes its dependent SLCs, from the register and the KG
 * (`kgSubsidiaryCodes`), when the request asks for it (procedure 9).
 */
export const registerChanges = (
  request: LocationCodeRequest,
  register: RegisteredCode[],
  kgSubsidiaryCodes: string[],
  now: string,
): RegisteredCode[] => {
  const code = request.decision?.code;
  if (!code) return [];
  const { data } = request;
  if (isCreation(data.operation)) return [createdEntry(request, code, now)];
  const key = keyOf(request, code);
  const entry =
    register.find((candidate) => candidate.key === key) ??
    entryFromKg(request, code);
  if (data.operation === "amendment")
    return [amendedEntry(request, entry, now)];
  if (data.codeType === "subsidiary" || !data.closeDependentCodes)
    return [closedEntry(request, entry, now)];
  return [
    closedEntry(request, entry, now),
    ...dependants(request, register, kgSubsidiaryCodes, now),
  ];
};

const dependants = (
  request: LocationCodeRequest,
  register: RegisteredCode[],
  kgSubsidiaryCodes: string[],
  now: string,
): RegisteredCode[] => {
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
  const fromRegister = register.filter(
    (code) =>
      code.codeType === "subsidiary" &&
      code.parentPrimaryCode === parent &&
      isActiveOn(code, today),
  );
  const registeredValues = new Set(fromRegister.map((code) => code.code));
  const fromKg = kgSubsidiaryCodes
    .filter((value) => !registeredValues.has(value))
    .map((value) => entryFromKg(subsidiaryRequest, value));
  return [...fromRegister, ...fromKg].map((entry) =>
    closedEntry(request, entry, now),
  );
};
