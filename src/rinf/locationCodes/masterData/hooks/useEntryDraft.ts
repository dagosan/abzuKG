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

import { useState } from "react";

export interface EntryDraft<Draft> {
  draft: Draft;
  update: (change: Partial<Draft>) => void;
  /** The user asked to save: problems are shown from then on. */
  tried: boolean;
  markTried: () => void;
}

/** The fields of a master data dialog while the user fills them in. */
export const useEntryDraft = <Draft>(initial: Draft): EntryDraft<Draft> => {
  const [draft, setDraft] = useState(initial);
  const [tried, setTried] = useState(false);
  return {
    draft,
    update: (change) => setDraft((current) => ({ ...current, ...change })),
    tried,
    markTried: () => setTried(true),
  };
};
