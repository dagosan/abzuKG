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

Added for the ERA RINF frontend, 2026-10-28. */

import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { CopyIdButton } from "../../components/modern/Shared";

interface DetailsHeaderProps {
  /** Text key of the overline, e.g. "Operational point". */
  titleId: string;
  name: string;
  canonicalId: string;
  onClose: () => void;
}

/** Kind, name, id with a copy button, and the close button. */
export const DetailsHeader = ({
  titleId,
  name,
  canonicalId,
  onClose,
}: DetailsHeaderProps) => {
  const { formatMessage } = useIntl();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        p: 2,
        pb: 1,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1.5 }}
        >
          {formatMessage({ id: titleId })}
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          sx={{ color: "primary.main", fontWeight: 700, lineHeight: 1.3 }}
        >
          {name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", overflowWrap: "anywhere" }}
          >
            {canonicalId}
          </Typography>
          <CopyIdButton idToCopy={canonicalId} />
        </Box>
      </Box>
      <Tooltip title={formatMessage({ id: "close" })}>
        <IconButton
          onClick={onClose}
          aria-label={formatMessage({ id: "close" })}
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
