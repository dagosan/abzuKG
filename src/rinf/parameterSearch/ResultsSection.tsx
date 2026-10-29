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

import { Box, CircularProgress, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../store/hooks";
import type { PlaceMatch } from "../models/parameterMatches";
import { ResultsList } from "./ResultsList";

const SPINNER_SIZE = 20;

interface ResultsSectionProps {
  onOpen: (place: PlaceMatch) => void;
}

/** The search's state: searching, failed, nothing found, or the summary and list. */
export const ResultsSection = ({ onOpen }: ResultsSectionProps) => {
  const { formatMessage } = useIntl();
  const { resultsStatus, places, truncated } = useAppSelector(
    (state) => state.rinf.parameterSearch,
  );

  if (resultsStatus === "idle") return null;
  if (resultsStatus === "loading") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2 }}>
        <CircularProgress size={SPINNER_SIZE} />
        <Typography variant="body2">
          {formatMessage({ id: "rinf_parameter_search_searching" })}
        </Typography>
      </Box>
    );
  }
  if (resultsStatus === "failed") {
    return (
      <Typography variant="body2" sx={{ p: 2, color: "error.main" }}>
        {formatMessage({ id: "rinf_parameter_search_failed" })}
      </Typography>
    );
  }

  const sections = places.filter(
    (place) => place.kind === "sectionOfLine",
  ).length;
  const elements = places.reduce((total, place) => total + place.matches, 0);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ px: 2, pt: 1, fontWeight: 700 }}>
        {formatMessage(
          { id: "rinf_parameter_search_summary" },
          {
            sections,
            operationalPoints: places.length - sections,
            elements,
          },
        )}
      </Typography>
      {truncated && (
        <Typography
          variant="caption"
          sx={{ px: 2, display: "block", color: "warning.main" }}
        >
          {formatMessage(
            { id: "rinf_parameter_search_truncated" },
            { count: places.length },
          )}
        </Typography>
      )}
      {places.length === 0 ? (
        <Typography variant="body2" sx={{ p: 2, color: "text.secondary" }}>
          {formatMessage({ id: "rinf_parameter_search_nothing" })}
        </Typography>
      ) : (
        <ResultsList places={places} onOpen={onOpen} />
      )}
    </Box>
  );
};
