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

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../store/hooks";
import { todayIsoDate } from "../../api/queryParts";
import {
  CHECKLIST_NUMBERS,
  CheckOutcome,
  CheckResult,
} from "../model/checklist";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { availableActions } from "../workflow/availableActions";
import type { PerformAction } from "./hooks/useRequestAction";
import { RequestFileSection } from "./RequestFileSection";

const OUTCOME_ICONS: Record<CheckOutcome, ReactNode> = {
  pass: (
    <CheckCircleOutlineIcon fontSize="small" sx={{ color: "success.main" }} />
  ),
  fail: <ErrorOutlineIcon fontSize="small" sx={{ color: "error.main" }} />,
  warning: <WarningAmberIcon fontSize="small" sx={{ color: "warning.main" }} />,
  manual: <HelpOutlineIcon fontSize="small" sx={{ color: "info.main" }} />,
  notApplicable: (
    <RemoveCircleOutlineOutlinedIcon
      fontSize="small"
      sx={{ color: "text.disabled" }}
    />
  ),
};

/** Check details name entitled parties by key; show them in words. */
const useTranslatedValues = () => {
  const { formatMessage } = useIntl();
  return ({ values }: CheckResult) =>
    values?.parties === undefined
      ? values
      : {
          ...values,
          parties: values.parties
            .split(", ")
            .map((party) => formatMessage({ id: `rinf_lc_party_${party}` }))
            .join(", "),
        };
};

interface ChecklistSectionProps {
  request: LocationCodeRequest;
  perform: PerformAction;
}

/** Annex A as run on this request; manual lines are confirmed one by one. */
export const ChecklistSection = ({
  request,
  perform,
}: ChecklistSectionProps) => {
  const { formatMessage, formatDate } = useIntl();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const translatedValues = useTranslatedValues();
  const canConfirm = availableActions(request, actor, todayIsoDate()).some(
    ({ action, blockedBy }) => action === "confirmCheck" && blockedBy === null,
  );
  const isConfirmed = (result: CheckResult) =>
    request.confirmedChecks.includes(result.item);

  return (
    <RequestFileSection titleId="rinf_lc_section_checks">
      {!request.checksRunAt ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatMessage({ id: "rinf_lc_checks_not_run" })}
        </Typography>
      ) : (
        <>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatMessage(
              { id: "rinf_lc_checks_run_at" },
              {
                date: formatDate(request.checksRunAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              },
            )}
          </Typography>
          <Table size="small">
            <TableBody>
              {request.checks.map((result) => (
                <TableRow key={result.item}>
                  <TableCell sx={{ width: 32, px: 0.5 }}>
                    {
                      OUTCOME_ICONS[
                        isConfirmed(result) ? "pass" : result.outcome
                      ]
                    }
                  </TableCell>
                  <TableCell sx={{ width: 64, color: "text.secondary" }}>
                    {CHECKLIST_NUMBERS[result.item]}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatMessage({ id: `rinf_lc_check_${result.item}` })}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {formatMessage(
                        { id: result.detailId },
                        translatedValues(result),
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    {result.outcome === "manual" &&
                      !isConfirmed(result) &&
                      canConfirm && (
                        <Button
                          size="small"
                          onClick={() =>
                            perform("confirmCheck", {
                              confirmedItem: result.item,
                            })
                          }
                        >
                          {formatMessage({ id: "rinf_lc_action_confirmCheck" })}
                        </Button>
                      )}
                    {isConfirmed(result) && (
                      <Typography
                        variant="caption"
                        sx={{ color: "success.main" }}
                      >
                        {formatMessage({ id: "rinf_lc_check_confirmed" })}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </RequestFileSection>
  );
};
