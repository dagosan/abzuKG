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

import { TableCell, TableRow, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { CODE_TYPE_ABBREVIATIONS } from "../model/codeTypes";
import type { CodeVersion, VersionChange } from "../model/CodeVersion";
import { CRD_FLAGS } from "../model/LocationCodeRequest";
import { findSubsidiaryType } from "../model/subsidiaryTypes";
import { RinfLinkText } from "../requestFile/RequestDataSection";
import { VersionStatusChip } from "./VersionStatusChip";

const NONE = "—";
const CAPTION_SX = { display: "block", color: "text.secondary" } as const;

interface RegisterRowProps {
  version: CodeVersion;
  today: string;
}

interface ChangeLineProps {
  change: VersionChange | null;
}

/** "Assigned · LC-2026-0001 · 2026-11-02" */
const ChangeLine = ({ change }: ChangeLineProps) => {
  const { formatMessage } = useIntl();
  if (!change) return null;
  return (
    <Typography
      variant="caption"
      sx={{ display: "block", whiteSpace: "nowrap" }}
    >
      {formatMessage({ id: `rinf_lc_change_${change.change}` })} ·{" "}
      {change.reference ?? change.requestId} · {change.at.slice(0, 10)}
    </Typography>
  );
};

/** One version of a code, with CRD's columns. */
export const RegisterRow = ({ version, today }: RegisterRowProps) => {
  const { formatMessage } = useIntl();
  const type = findSubsidiaryType(version.subsidiaryTypeCode);
  const uses = CRD_FLAGS.filter((flag) => version[flag]).map((flag) =>
    formatMessage({ id: `rinf_lc_crd_${flag}_short` }),
  );
  const asciiDiffers = version.locationNameAscii !== version.locationName;
  return (
    <TableRow>
      <TableCell sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
        {version.key}
        <Typography variant="caption" sx={CAPTION_SX}>
          {formatMessage(
            { id: "rinf_lc_register_version" },
            { version: version.version },
          )}
        </Typography>
      </TableCell>
      <TableCell>{CODE_TYPE_ABBREVIATIONS[version.codeType]}</TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {version.startValidity ?? NONE} → {version.endValidity ?? ""}
      </TableCell>
      <TableCell>
        <VersionStatusChip version={version} today={today} />
      </TableCell>
      <TableCell>
        {version.locationName || NONE}
        {asciiDiffers && version.locationNameAscii && (
          <Typography variant="caption" sx={CAPTION_SX}>
            {version.locationNameAscii}
          </Typography>
        )}
        {version.freeText && (
          <Typography
            variant="caption"
            sx={{ ...CAPTION_SX, fontStyle: "italic" }}
          >
            {version.freeText}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        {version.codeType === "primary"
          ? version.responsibleImCode || NONE
          : type
            ? `${type.code} ${type.name}`
            : NONE}
      </TableCell>
      <TableCell>{uses.join(", ") || NONE}</TableCell>
      <TableCell>{version.nutsCode || NONE}</TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {version.latitude !== null && version.longitude !== null
          ? `${version.latitude}, ${version.longitude}`
          : NONE}
      </TableCell>
      <TableCell>
        <RinfLinkText link={version.rinfLink} />
      </TableCell>
      <TableCell>
        <ChangeLine change={version.openedBy} />
        <ChangeLine change={version.endedBy} />
      </TableCell>
    </TableRow>
  );
};
