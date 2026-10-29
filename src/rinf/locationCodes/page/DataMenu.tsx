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

Added for the ERA RINF frontend, 2026-10-29; backup through the store (browser or Tiamat) the same day. */

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, Menu, MenuItem, Snackbar, Tooltip } from "@mui/material";
import { ChangeEvent, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useAppDispatch } from "../../../store/hooks";
import { locationCodeStore, locationCodeStoreKind } from "../store/activeStore";
import { loadLocationCodes } from "../state/locationCodesThunks";
import { parseBackup } from "../store/backupFile";
import type { LocationCodeSnapshot } from "../store/LocationCodeStore";

const BACKUP_FILE_NAME = "location-code-requests.json";
const JSON_INDENT = 2;
const MESSAGE_DURATION_MS = 8000;
const TEXT_KEY_PREFIX = "rinf_lc_";

/**
 * Backup and restore, from whichever store is in use. With the browser store
 * this is how requests move to another browser or into Tiamat; Tiamat adds
 * a backup's entries and refuses one that disagrees with what it holds.
 */
export const DataMenu = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const label = formatMessage({ id: "rinf_lc_data_menu" });
  const storedIn = formatMessage({
    id: `rinf_lc_data_stored_${locationCodeStoreKind()}`,
  });

  const exportData = async () => {
    setAnchor(null);
    let snapshot: LocationCodeSnapshot;
    try {
      snapshot = await locationCodeStore.exportSnapshot();
    } catch (error) {
      setMessage(refusedMessage(error));
      return;
    }
    const blob = new Blob([JSON.stringify(snapshot, null, JSON_INDENT)], {
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
    const snapshot = parseBackup(await file.text());
    if (!snapshot) {
      setMessage(formatMessage({ id: "rinf_lc_data_import_failed" }));
      return;
    }
    try {
      await locationCodeStore.importSnapshot(snapshot);
      dispatch(loadLocationCodes());
    } catch (error) {
      setMessage(refusedMessage(error));
    }
  };

  const refusedMessage = (error: unknown): string => {
    const reason = error instanceof Error ? error.message : String(error);
    return formatMessage(
      { id: "rinf_lc_data_refused" },
      {
        message: reason.startsWith(TEXT_KEY_PREFIX)
          ? formatMessage({ id: reason })
          : reason,
      },
    );
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
        <MenuItem disabled>{storedIn}</MenuItem>
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
        open={message !== null}
        autoHideDuration={MESSAGE_DURATION_MS}
        onClose={() => setMessage(null)}
        message={message}
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
