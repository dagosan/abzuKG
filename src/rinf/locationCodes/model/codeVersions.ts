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

import type { CodeVersion } from "./CodeVersion";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 10;

/** CRD's Active_Flag: valid on `isoDate` (YYYY-MM-DD). */
export const isActiveOn = (version: CodeVersion, isoDate: string): boolean =>
  (version.startValidity === null || version.startValidity <= isoDate) &&
  isOpenOn(version, isoDate);

/** Not ended by `isoDate`: still valid then, or valid from later. */
export const isOpenOn = (version: CodeVersion, isoDate: string): boolean =>
  version.endValidity === null || version.endValidity >= isoDate;

/** Unique id of a version, e.g. "BE00438#2". */
export const versionId = ({ key, version }: CodeVersion): string =>
  `${key}#${version}`;

const byVersion = (first: CodeVersion, second: CodeVersion): number =>
  first.version - second.version;

/** The versions of one code, oldest first. */
export const versionsOf = (
  versions: readonly CodeVersion[],
  key: string,
): CodeVersion[] =>
  versions.filter((version) => version.key === key).sort(byVersion);

/** The latest version of each code: what the code is now, or was when it closed. */
export const currentVersions = (
  versions: readonly CodeVersion[],
): CodeVersion[] => {
  const latest = new Map<string, CodeVersion>();
  versions.forEach((version) => {
    const known = latest.get(version.key);
    if (!known || known.version < version.version)
      latest.set(version.key, version);
  });
  return [...latest.values()];
};

/** Replaces versions by id and adds new ones. */
export const mergeVersions = (
  versions: readonly CodeVersion[],
  changed: readonly CodeVersion[],
): CodeVersion[] => {
  const changedIds = new Set(changed.map(versionId));
  return [
    ...versions.filter((version) => !changedIds.has(versionId(version))),
    ...changed,
  ];
};

/** The day before an ISO date: the last day of a version that ends on `isoDate`. */
export const dayBefore = (isoDate: string): string =>
  new Date(Date.parse(`${isoDate}T00:00:00Z`) - MILLISECONDS_PER_DAY)
    .toISOString()
    .slice(0, ISO_DATE_LENGTH);
