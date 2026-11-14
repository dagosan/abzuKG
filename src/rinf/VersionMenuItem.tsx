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

Added for the ERA Location Code Manager, 2026-11-14. */

import { OpenInNew, SellOutlined } from "@mui/icons-material";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { useIntl } from "react-intl";
import { CHANGELOG_URL, LOCATION_CODE_MANAGER_VERSION } from "./version";

const ICON_MIN_WIDTH = 36;
const EXTERNAL_LINK_ICON_SIZE = 16;

interface VersionMenuItemProps {
  onClick: () => void;
}

/** The running version, in the header's help menu; opens the change log. */
export const VersionMenuItem = ({ onClick }: VersionMenuItemProps) => {
  const { formatMessage } = useIntl();
  const versionLabel = formatMessage(
    { id: "rinf_version" },
    { version: LOCATION_CODE_MANAGER_VERSION },
  );
  const changeLogLabel = formatMessage({ id: "rinf_version_change_log" });

  return (
    <MenuItem
      component="a"
      href={CHANGELOG_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={formatMessage(
        { id: "navigation_opens_in_new_tab" },
        { label: `${versionLabel}, ${changeLogLabel}` },
      )}
      onClick={onClick}
    >
      <ListItemIcon sx={{ minWidth: ICON_MIN_WIDTH, color: "primary.main" }}>
        <SellOutlined />
      </ListItemIcon>
      <ListItemText primary={versionLabel} secondary={changeLogLabel} />
      <OpenInNew
        sx={{ ml: 1, fontSize: EXTERNAL_LINK_ICON_SIZE, opacity: 0.6 }}
      />
    </MenuItem>
  );
};
