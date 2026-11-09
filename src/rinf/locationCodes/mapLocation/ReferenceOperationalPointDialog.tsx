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

Added for the ERA RINF frontend, 2026-11-09. */

import AdsClickIcon from "@mui/icons-material/AdsClick";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import type { OperationalPoint } from "../../models/OperationalPoint";
import { useNearbyOperationalPoints } from "./hooks/useNearbyOperationalPoints";
import { formatPosition, MapPosition } from "./mapPosition";
import { NearbyOperationalPointItem } from "./NearbyOperationalPointItem";
import { NEARBY_COUNT, NEARBY_RADIUS_KM } from "./nearbyOperationalPoints";

const SPINNER_SIZE = 28;

interface ReferenceOperationalPointDialogProps {
  /** The point being used; null keeps the dialog closed. */
  position: MapPosition | null;
  onChoose: (operationalPoint: OperationalPoint) => void;
  onPickOnMap: () => void;
  onClose: () => void;
}

/**
 * Second step of "Use this location": the reference OP, chosen from the
 * nearest ones (nearest first) or, as the last choice, on the map.
 */
export const ReferenceOperationalPointDialog = ({
  position,
  onChoose,
  onPickOnMap,
  onClose,
}: ReferenceOperationalPointDialogProps) => {
  const { formatMessage } = useIntl();
  const { status, nearby } = useNearbyOperationalPoints(position);
  const limits = {
    count: String(NEARBY_COUNT),
    radius: String(NEARBY_RADIUS_KM),
  };

  return (
    <Dialog open={position !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {formatMessage({ id: "rinf_lc_map_reference_title" })}
        {position && (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontFamily: "monospace" }}
          >
            {formatPosition(position)}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ px: 0, py: 0 }}>
        <Typography variant="body2" sx={{ px: 3, pt: 2, pb: 1 }}>
          {formatMessage({ id: "rinf_lc_map_reference_hint" }, limits)}
        </Typography>
        {status === "loading" && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress
              size={SPINNER_SIZE}
              aria-label={formatMessage({ id: "rinf_lc_map_reference_loading" })}
            />
          </Box>
        )}
        {status === "failed" && (
          <Alert severity="warning" sx={{ mx: 3, my: 1 }}>
            {formatMessage({ id: "rinf_lc_map_reference_failed" })}
          </Alert>
        )}
        {status === "loaded" && nearby.length === 0 && (
          <Alert severity="info" sx={{ mx: 3, my: 1 }}>
            {formatMessage({ id: "rinf_lc_map_reference_none" }, limits)}
          </Alert>
        )}
        <List dense>
          {nearby.map((item) => (
            <NearbyOperationalPointItem
              key={item.operationalPoint.canonicalId}
              nearby={item}
              onChoose={onChoose}
            />
          ))}
          {status !== "loading" && (
            <>
              {nearby.length > 0 && <Divider component="li" />}
              <ListItemButton onClick={onPickOnMap}>
                <ListItemIcon>
                  <AdsClickIcon sx={{ color: "primary.main" }} />
                </ListItemIcon>
                <ListItemText
                  primary={formatMessage({
                    id: "rinf_lc_map_reference_pick_on_map",
                  })}
                  secondary={formatMessage({
                    id: "rinf_lc_map_reference_pick_on_map_hint",
                  })}
                />
              </ListItemButton>
            </>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {formatMessage({ id: "rinf_lc_map_reference_cancel" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
