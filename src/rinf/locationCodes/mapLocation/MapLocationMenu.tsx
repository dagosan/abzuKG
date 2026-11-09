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

Added for the ERA RINF frontend, 2026-11-09. Same day: always opens; the item says why it can't be used. */

import AddLocationAltOutlinedIcon from "@mui/icons-material/AddLocationAltOutlined";
import {
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from "@mui/material";
import { useIntl } from "react-intl";
import type { MapContextMenuAt } from "./hooks/useMapContextMenu";
import { formatPosition } from "./mapPosition";

const SUBHEADER_LINE_HEIGHT = 2.5;
const MENU_ITEM_MAX_WIDTH = 320;

interface MapLocationMenuProps {
  openAt: MapContextMenuAt | null;
  onUseLocation: () => void;
  onClose: () => void;
  /** Text key saying why "Use this location" can't be used now; null if it can. */
  unavailableId: string | null;
}

/** The map's right-click menu: the point's coordinates and what to do with it. */
export const MapLocationMenu = ({
  openAt,
  onUseLocation,
  onClose,
  unavailableId,
}: MapLocationMenuProps) => {
  const { formatMessage } = useIntl();
  return (
    <Menu
      open={openAt !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        openAt ? { top: openAt.screenTop, left: openAt.screenLeft } : undefined
      }
      onContextMenu={(event) => {
        // A second right-click on the backdrop closes the menu, not the browser's.
        event.preventDefault();
        onClose();
      }}
    >
      {openAt && (
        <ListSubheader
          sx={{ lineHeight: SUBHEADER_LINE_HEIGHT, fontFamily: "monospace" }}
        >
          {formatPosition(openAt.position)}
        </ListSubheader>
      )}
      <MenuItem
        onClick={onUseLocation}
        disabled={unavailableId !== null}
        sx={{ whiteSpace: "normal", maxWidth: MENU_ITEM_MAX_WIDTH }}
      >
        <ListItemIcon>
          <AddLocationAltOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={formatMessage({ id: "rinf_lc_map_use_location" })}
          secondary={unavailableId && formatMessage({ id: unavailableId })}
        />
      </MenuItem>
    </Menu>
  );
};
