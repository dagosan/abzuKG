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

import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../store/hooks";
import { todayIsoDate } from "../../api/queryParts";
import { CODE_TYPE_ABBREVIATIONS } from "../model/codeTypes";
import { isActiveOn, RegisteredCode } from "../model/RegisteredCode";
import { findSubsidiaryType } from "../model/subsidiaryTypes";
import { RinfLinkText } from "../requestFile/RequestDataSection";

const FILTER_WIDTH = 320;
const COLUMN_IDS = [
  "code",
  "type",
  "name",
  "im_or_type",
  "rinf",
  "status",
  "history",
];

const matches = (code: RegisteredCode, text: string) =>
  [
    code.key,
    code.name,
    code.imOrganisationCode,
    code.rinfLink?.canonicalId ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(text.toLowerCase());

/** The codes this workflow recorded and published, open or closed. */
export const RegisterTable = () => {
  const { formatMessage } = useIntl();
  const codes = useAppSelector((state) => state.rinf.locationCodes.codes);
  const [filter, setFilter] = useState("");
  const today = todayIsoDate();
  const rows = useMemo(
    () =>
      codes
        .filter((code) => matches(code, filter))
        .sort((first, second) => first.key.localeCompare(second.key)),
    [codes, filter],
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" component="h2">
        {formatMessage({ id: "rinf_lc_register_title" })}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        {formatMessage({ id: "rinf_lc_register_hint" })}
      </Typography>
      <TextField
        size="small"
        label={formatMessage({ id: "rinf_lc_register_filter" })}
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        sx={{ width: FILTER_WIDTH, mb: 2 }}
      />
      {rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatMessage({ id: "rinf_lc_register_empty" })}
        </Typography>
      ) : (
        <Table size="small" sx={{ bgcolor: "background.paper" }}>
          <TableHead>
            <TableRow>
              {COLUMN_IDS.map((column) => (
                <TableCell key={column}>
                  {formatMessage({ id: `rinf_lc_register_column_${column}` })}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((code) => {
              const active = isActiveOn(code, today);
              const type = findSubsidiaryType(code.subsidiaryTypeCode);
              return (
                <TableRow key={code.key}>
                  <TableCell sx={{ fontFamily: "monospace" }}>
                    {code.key}
                  </TableCell>
                  <TableCell>
                    {CODE_TYPE_ABBREVIATIONS[code.codeType]}
                  </TableCell>
                  <TableCell>{code.name || "—"}</TableCell>
                  <TableCell>
                    {code.codeType === "primary"
                      ? code.imOrganisationCode
                      : type
                        ? `${type.code} ${type.name}`
                        : ""}
                  </TableCell>
                  <TableCell>
                    <RinfLinkText link={code.rinfLink} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={active ? "success" : "default"}
                      variant={active ? "filled" : "outlined"}
                      label={formatMessage(
                        {
                          id: active
                            ? code.closedFrom
                              ? "rinf_lc_code_closing"
                              : "rinf_lc_code_active"
                            : "rinf_lc_code_closed",
                        },
                        { date: code.closedFrom ?? "" },
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    {code.history.map((entry) => (
                      <Typography
                        key={entry.requestId + entry.change}
                        variant="caption"
                        sx={{ display: "block" }}
                      >
                        {formatMessage({
                          id: `rinf_lc_change_${entry.change}`,
                        })}{" "}
                        · {entry.reference ?? entry.requestId} ·{" "}
                        {entry.at.slice(0, 10)}
                      </Typography>
                    ))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};
