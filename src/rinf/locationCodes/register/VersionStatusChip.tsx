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

Added for the ERA RINF frontend, 2026-11-02. */

import { Chip } from "@mui/material";
import { useIntl } from "react-intl";
import type { CodeVersion } from "../model/CodeVersion";
import { isActiveOn } from "../model/codeVersions";

interface VersionStatusChipProps {
  version: CodeVersion;
  today: string;
}

/** Active, starting later, replaced by a newer version, or closed. */
export const VersionStatusChip = ({
  version,
  today,
}: VersionStatusChipProps) => {
  const { formatMessage } = useIntl();
  const active = isActiveOn(version, today);
  const startsLater =
    version.startValidity !== null && version.startValidity > today;
  const replaced = version.endedBy?.change === "amended";
  const id = active
    ? version.endValidity
      ? "rinf_lc_code_closing"
      : "rinf_lc_code_active"
    : startsLater
      ? "rinf_lc_code_future"
      : replaced
        ? "rinf_lc_code_replaced"
        : "rinf_lc_code_closed";
  return (
    <Chip
      size="small"
      color={active ? "success" : "default"}
      variant={active ? "filled" : "outlined"}
      label={formatMessage(
        { id },
        {
          date:
            (startsLater ? version.startValidity : version.endValidity) ?? "",
        },
      )}
    />
  );
};
