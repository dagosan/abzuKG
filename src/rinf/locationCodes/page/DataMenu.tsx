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

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, Menu, MenuItem, Snackbar, Tooltip } from "@mui/material";
import { ChangeEvent, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useAppDispatch } from "../../../store/hooks";
import { readSnapshot, writeSnapshot } from "../store/browserStore";
import { loadLocationCodes } from "../state/locationCodesThunks";

const BACKUP_FILE_NAME = "location-code-requests.json";
const JSON_INDENT = 2;
const MESSAGE_DURATION_MS = 6000;

/**
 * Backup and restore. Requests live in this browser only, so this is how
 * they move to another browser or survive clearing site data.
 */
export const DataMenu = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [importFailed, setImportFailed] = useState(false);
  const label = formatMessage({ id: "rinf_lc_data_menu" });

  const exportData = () => {
    setAnchor(null);
    const blob = new Blob([JSON.stringify(readSnapshot(), null, JSON_INDENT)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = BACKUP_FILE_NAME;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const snapshot = JSON.parse(await file.text());
      if (!Array.isArray(snapshot.requests) || !Array.isArray(snapshot.codes))
        throw new Error("Not a backup");
      writeSnapshot({
        requests: snapshot.requests,
        codes: snapshot.codes,
        sequences: snapshot.sequences ?? {},
      });
      dispatch(loadLocationCodes());
    } catch {
      setImportFailed(true);
    }
  };

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          size="small"
          aria-label={label}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        <MenuItem onClick={exportData}>
          {formatMessage({ id: "rinf_lc_data_export" })}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            fileInput.current?.click();
          }}
        >
          {formatMessage({ id: "rinf_lc_data_import" })}
        </MenuItem>
      </Menu>
      <Snackbar
        open={importFailed}
        autoHideDuration={MESSAGE_DURATION_MS}
        onClose={() => setImportFailed(false)}
        message={formatMessage({ id: "rinf_lc_data_import_failed" })}
      />
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={importData}
      />
    </>
  );
};
