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

import AdsClickIcon from "@mui/icons-material/AdsClick";
import { Button, Paper, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { usePickTarget } from "./usePickTarget";

const TOP_OFFSET = 12;
const MAX_WIDTH = 640;

/** Over the map while picking: what to click, and the way back to the form. */
export const PickingBanner = () => {
  const { formatMessage } = useIntl();
  const { picking, cancel } = usePickTarget();
  if (!picking) return null;
  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        top: TOP_OFFSET,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        pl: 2,
        pr: 1,
        py: 1,
        borderRadius: 2,
        width: `min(${MAX_WIDTH}px, calc(100% - 32px))`,
        borderLeft: 4,
        borderColor: "primary.main",
      }}
    >
      <AdsClickIcon sx={{ color: "primary.main" }} />
      <Typography variant="body2" sx={{ flex: 1 }}>
        {formatMessage({
          id: picking.allowAssets
            ? "rinf_lc_picking_hint_assets"
            : "rinf_lc_picking_hint",
        })}
      </Typography>
      <Button size="small" onClick={cancel} sx={{ flexShrink: 0 }}>
        {formatMessage({ id: "rinf_lc_picking_back" })}
      </Button>
    </Paper>
  );
};
