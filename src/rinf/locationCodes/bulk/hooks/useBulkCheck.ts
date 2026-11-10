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

Added for the ERA Location Code Manager, 2026-11-10. */

import { useCallback, useState } from "react";
import { todayIsoDate } from "../../../api/queryParts";
import { useRinfSparqlEndpoint } from "../../../config/rinfEndpoint";
import { fetchCountryCodes } from "../../checks/kgLookups";
import type { CodeVersion } from "../../model/CodeVersion";
import { locationCodeStore } from "../../store/activeStore";
import { readBulkFile } from "../bulkFile";
import { countriesToAsk } from "../bulkRegisterChecks";
import type { BulkLine, BulkReport } from "../bulkReport";
import { checkBulkLines } from "../checkBulkLines";

const NOT_UTF8 = "rinf_lc_bulk_file_not_utf8";

export interface BulkCheck {
  checking: boolean;
  report: BulkReport | null;
  /** Reads the file and checks it; nothing is sent or saved. */
  check: (file: File) => void;
}

/** The file's text, or null when it is not valid UTF-8. */
const readUtf8 = async (file: File): Promise<string | null> => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      await file.arrayBuffer(),
    );
  } catch {
    return null;
  }
};

/** The register's versions, or null when it cannot be read. */
const readRegister = async (): Promise<CodeVersion[] | null> => {
  try {
    return await locationCodeStore.loadCodes();
  } catch {
    return null;
  }
};

/** The PLCs the Knowledge Graph holds for the countries asked; null when it cannot be reached. */
const readKnowledgeGraph = async (
  endpoint: string,
  countries: string[],
): Promise<Set<string> | null> => {
  try {
    const codes = await Promise.all(
      countries.map((country) => fetchCountryCodes(endpoint, country)),
    );
    return new Set(codes.flat());
  } catch {
    return null;
  }
};

const checkLines = async (
  fileName: string,
  lines: BulkLine[],
  endpoint: string,
): Promise<BulkReport> => {
  const register = await readRegister();
  const knowledgeGraphCodes = await readKnowledgeGraph(
    endpoint,
    countriesToAsk(lines, register ?? []),
  );
  return {
    fileName,
    fileProblems: [],
    lines: checkBulkLines(lines, {
      today: todayIsoDate(),
      register: register ?? [],
      knowledgeGraphCodes,
    }),
    knowledgeGraphReached: knowledgeGraphCodes !== null,
    registerReached: register !== null,
  };
};

const refusedFile = (
  fileName: string,
  fileProblems: BulkReport["fileProblems"],
): BulkReport => ({
  fileName,
  fileProblems,
  lines: [],
  knowledgeGraphReached: true,
  registerReached: true,
});

/**
 * Checks a bulk request file as Annex A.3 describes: the file, then each
 * line against the annex, the register and the Knowledge Graph.
 */
export const useBulkCheck = (): BulkCheck => {
  const endpoint = useRinfSparqlEndpoint();
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<BulkReport | null>(null);

  const check = useCallback(
    (file: File) => {
      const run = async (): Promise<BulkReport> => {
        const content = await readUtf8(file);
        if (content === null)
          return refusedFile(file.name, [{ messageId: NOT_UTF8 }]);
        const { problems, lines } = readBulkFile(content);
        return problems.length > 0
          ? refusedFile(file.name, problems)
          : checkLines(file.name, lines, endpoint);
      };
      setChecking(true);
      setReport(null);
      run()
        .then(setReport)
        .finally(() => setChecking(false));
    },
    [endpoint],
  );

  return { checking, report, check };
};
