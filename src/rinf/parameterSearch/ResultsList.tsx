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

import { Box, Button, List } from "@mui/material";
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../store/hooks";
import { defineTerm } from "../models/ParameterDictionary";
import type { PlaceMatch } from "../models/parameterMatches";
import { ResultRow } from "./ResultRow";

/** Rows rendered at once; more appear on request, so thousands stay quick. */
const PAGE_SIZE = 100;

interface ResultsListProps {
  places: PlaceMatch[];
  onOpen: (place: PlaceMatch) => void;
}

/** The matching sections of line and OPs, by name. */
export const ResultsList = ({ places, onOpen }: ResultsListProps) => {
  const { formatMessage } = useIntl();
  const dictionary = useAppSelector(
    (state) => state.rinf.parameterDictionary.entries,
  );
  const [shown, setShown] = useState(PAGE_SIZE);
  const sorted = useMemo(
    () =>
      [...places].sort((first, second) =>
        first.name.localeCompare(second.name, "en", { numeric: true }),
      ),
    [places],
  );

  return (
    <Box>
      <List disablePadding dense>
        {sorted.slice(0, shown).map((place) => (
          <ResultRow
            key={`${place.kind}/${place.canonicalId}`}
            place={place}
            elementTypeLabel={
              place.elementTypeUri
                ? defineTerm(dictionary, place.elementTypeUri).label
                : null
            }
            onOpen={onOpen}
          />
        ))}
      </List>
      {shown < sorted.length && (
        <Box sx={{ p: 1.5, textAlign: "center" }}>
          <Button size="small" onClick={() => setShown(shown + PAGE_SIZE)}>
            {formatMessage(
              { id: "rinf_parameter_search_show_more" },
              { count: Math.min(PAGE_SIZE, sorted.length - shown) },
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};
