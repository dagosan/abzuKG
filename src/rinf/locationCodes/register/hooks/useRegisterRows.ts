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

import { useMemo } from "react";
import type { CodeVersion } from "../../model/CodeVersion";
import { currentVersions } from "../../model/codeVersions";

export interface RegisterRows {
  rows: CodeVersion[];
  /** Number of codes (not versions) recorded. */
  codeCount: number;
}

const searchText = (version: CodeVersion): string =>
  [
    version.key,
    version.locationName,
    version.locationNameAscii,
    version.responsibleImCode,
    version.nutsCode,
    version.rinfLink?.canonicalId ?? "",
  ]
    .join(" ")
    .toLowerCase();

/** Codes in order, the newest version of each first. */
const byCodeThenNewest = (first: CodeVersion, second: CodeVersion): number =>
  first.key.localeCompare(second.key) || second.version - first.version;

/** The register's rows: every version, or the latest of each code; filtered by `filter`. */
export const useRegisterRows = (
  versions: CodeVersion[],
  filter: string,
  withEarlierVersions: boolean,
): RegisterRows =>
  useMemo(() => {
    const text = filter.trim().toLowerCase();
    const shown = withEarlierVersions ? versions : currentVersions(versions);
    return {
      rows: shown
        .filter((version) => searchText(version).includes(text))
        .sort(byCodeThenNewest),
      codeCount: new Set(versions.map((version) => version.key)).size,
    };
  }, [versions, filter, withEarlierVersions]);
