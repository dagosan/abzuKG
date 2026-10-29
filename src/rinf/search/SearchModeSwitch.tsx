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

import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import TrainOutlined from "@mui/icons-material/TrainOutlined";
import {
  alpha,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  type SvgIconProps,
} from "@mui/material";
import type { ComponentType } from "react";
import { useIntl } from "react-intl";
import type { SearchMode } from "../state/preferences";

/** Border and selected-state strength on the header's coloured background. */
const BORDER_OPACITY = 0.5;
const SELECTED_OPACITY = 0.2;
const MODES: {
  mode: SearchMode;
  labelId: string;
  Icon: ComponentType<SvgIconProps>;
}[] = [
  { mode: "rinf", labelId: "rinf_search_mode_rinf", Icon: TrainOutlined },
  {
    mode: "stopPlaces",
    labelId: "rinf_search_mode_stop_places",
    Icon: PlaceOutlined,
  },
];

interface SearchModeSwitchProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
  /** Icons instead of words, for a narrow header. */
  compact?: boolean;
}

/** Chooses what the header search looks for: RINF OPs or Abzu's stop places. */
export const SearchModeSwitch = ({
  mode,
  onChange,
  compact = false,
}: SearchModeSwitchProps) => {
  const { formatMessage } = useIntl();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={mode}
      onChange={(_event, value: SearchMode | null) => value && onChange(value)}
      aria-label={formatMessage({ id: "rinf_search_mode_label" })}
      sx={(theme) => {
        const contrast = theme.palette.primary.contrastText;
        return {
          flexShrink: 0,
          mr: 1,
          "& .MuiToggleButton-root": {
            color: contrast,
            borderColor: alpha(contrast, BORDER_OPACITY),
            textTransform: "none",
            whiteSpace: "nowrap",
            px: compact ? 0.75 : 1.25,
          },
          "& .MuiToggleButton-root.Mui-selected": {
            color: contrast,
            backgroundColor: alpha(contrast, SELECTED_OPACITY),
          },
        };
      }}
    >
      {MODES.map(({ mode: value, labelId, Icon }) => {
        const label = formatMessage({ id: labelId });
        if (!compact)
          return (
            <ToggleButton key={value} value={value}>
              {label}
            </ToggleButton>
          );
        return (
          <Tooltip key={value} title={label}>
            <ToggleButton value={value} aria-label={label}>
              <Icon fontSize="small" />
            </ToggleButton>
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );
};
