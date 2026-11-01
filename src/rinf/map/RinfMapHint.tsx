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

Added for the ERA RINF frontend, 2026-11-01. */

import { Paper, Stack, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../store/hooks";
import { useMapZoom } from "./hooks/useMapZoom";
import { RINF_MIN_ZOOM } from "./hooks/useViewportLoader";
import { CodeChip } from "./locationCodes/CodeChip";
import { CODE_SOURCES } from "./locationCodes/codeLabelTypes";
import { codeLabelsDrawable } from "./locationCodes/codeLabelZoom";
import { useCodeLabels } from "./locationCodes/hooks/useCodeLabels";

const BOTTOM_OFFSET = 32;
const SAMPLE_CODE = "XX00000";

/**
 * Bottom-centre of the map: below RINF_MIN_ZOOM says to zoom in (the map is
 * empty otherwise); else, with codes on, the legend of the code labels.
 */
export const RinfMapHint = () => {
  const { formatMessage } = useIntl();
  const zoom = useMapZoom();
  const showPoints = useAppSelector(
    (state) => state.rinf.operationalPoints.show,
  );
  const showLines = useAppSelector((state) => state.rinf.sectionsOfLine.show);
  const showCodes = useAppSelector(
    (state) => state.rinf.locationCodeLabels.show,
  );
  const { labels, registerUnavailable } = useCodeLabels(showCodes);
  const tooFarOut = zoom < RINF_MIN_ZOOM;

  if (tooFarOut && !showPoints && !showLines) return null;
  if (!tooFarOut && !showCodes) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        bottom: BOTTOM_OFFSET,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 2,
        maxWidth: "calc(100% - 32px)",
      }}
    >
      {tooFarOut ? (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatMessage({ id: "rinf_map_zoom_in" })}
        </Typography>
      ) : (
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
            columnGap: 1.5,
            rowGap: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {formatMessage({ id: "rinf_map_codes_legend_title" })}
          </Typography>
          {CODE_SOURCES.map((source) => (
            <Stack
              key={source}
              direction="row"
              sx={{ alignItems: "center", gap: 0.5 }}
            >
              <CodeChip text={SAMPLE_CODE} source={source} />
              <Typography variant="caption">
                {formatMessage({ id: `rinf_map_codes_${source}` })}
              </Typography>
            </Stack>
          ))}
          {!codeLabelsDrawable(zoom, labels.length) && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatMessage({ id: "rinf_map_codes_zoom_in" })}
            </Typography>
          )}
          {registerUnavailable && (
            <Typography variant="caption" sx={{ color: "warning.main" }}>
              {formatMessage({ id: "rinf_map_codes_register_unavailable" })}
            </Typography>
          )}
        </Stack>
      )}
    </Paper>
  );
};
