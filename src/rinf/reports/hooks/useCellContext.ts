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

import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../store/hooks";
import { DETAILS_KINDS } from "../../detailsKinds";
import { defineTerm } from "../../models/ParameterDictionary";
import type { CellContext } from "../reportColumns";

/** Kind names from the text keys, element type names from the ERA vocabulary. */
export const useCellContext = (): CellContext => {
  const { formatMessage } = useIntl();
  const dictionary = useAppSelector(
    (state) => state.rinf.parameterDictionary.entries,
  );
  return useMemo(
    () => ({
      kindLabel: (kind) => formatMessage({ id: DETAILS_KINDS[kind].titleId }),
      elementTypeLabel: (typeUri) => defineTerm(dictionary, typeUri).label,
    }),
    [dictionary, formatMessage],
  );
};
