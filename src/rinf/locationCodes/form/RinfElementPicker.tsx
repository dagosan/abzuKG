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

import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  Chip,
  FormHelperText,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { Link as RouterLink } from "react-router-dom";
import type { RinfLink } from "../model/LocationCodeRequest";
import { rinfLinkPath, rinfLinkText } from "../model/rinfLink";
import { RinfElementSearchField } from "./RinfElementSearchField";

interface RinfElementPickerProps {
  value: RinfLink | null;
  onChange: (link: RinfLink | null) => void;
  label: string;
  helperText?: string;
  error?: boolean;
  /** Offers "Pick on map" when given; the caller hands over to the map. */
  onPickOnMap?: () => void;
}

/**
 * The RINF element a code is positioned on: picked on the map, or found by
 * name, UOPID or line number.
 */
export const RinfElementPicker = ({
  value,
  onChange,
  label,
  helperText,
  error,
  onPickOnMap,
}: RinfElementPickerProps) => {
  const { formatMessage } = useIntl();
  const openLabel = formatMessage({ id: "rinf_lc_open_in_rinf" });
  const path = value ? rinfLinkPath(value) : null;
  const pickButton = onPickOnMap && (
    <Button
      size="small"
      variant="outlined"
      startIcon={<MapOutlinedIcon />}
      onClick={onPickOnMap}
      sx={{ flexShrink: 0 }}
    >
      {formatMessage({
        id: value ? "rinf_lc_pick_again" : "rinf_lc_pick_on_map",
      })}
    </Button>
  );

  return (
    <Box>
      {value && (
        <Typography
          variant="caption"
          component="div"
          sx={{ color: "text.secondary", mb: 0.5 }}
        >
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {value ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              minWidth: 0,
            }}
          >
            <Chip
              label={rinfLinkText(value)}
              onDelete={() => onChange(null)}
              color="primary"
              variant="outlined"
              sx={{ maxWidth: "100%" }}
            />
            {path && (
              <Tooltip title={openLabel}>
                <IconButton
                  size="small"
                  component={RouterLink}
                  to={path}
                  target="_blank"
                  aria-label={openLabel}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ) : (
          <RinfElementSearchField
            label={label}
            error={error}
            onPick={onChange}
          />
        )}
        {pickButton}
      </Box>
      <FormHelperText error={error} sx={{ mx: 1.75 }}>
        {helperText ??
          formatMessage({
            id: onPickOnMap
              ? "rinf_lc_rinf_picker_hint_map"
              : "rinf_lc_rinf_picker_hint",
          })}
      </FormHelperText>
    </Box>
  );
};
