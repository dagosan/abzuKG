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

Added for the ERA Location Code Manager, 2026-11-10.
Modified 2026-11-14: steps are taken on the lines ticked in the table. */

import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../../store/hooks";
import { todayIsoDate } from "../../../api/queryParts";
import type { LocationCodeRequest } from "../../model/LocationCodeRequest";
import { errorText } from "../../masterData/validityText";
import { BATCH_ACTIONS, linesReadyFor } from "../bulkBatch";
import { bulkRegistrationRefusal } from "../bulkRequests";
import { BatchProgress, useBulkBatch } from "./hooks/useBulkBatch";

const PERCENT = 100;

interface BatchResultProps {
  progress: BatchProgress;
}

/** How far a batch is, then what it came to. */
const BatchResult = ({ progress }: BatchResultProps) => {
  const { formatMessage } = useIntl();
  const { action, done, total, failed, firstError, running } = progress;
  const values = {
    action: formatMessage({ id: `rinf_lc_bulk_batch_${action}` }),
    done,
    total,
    failed,
  };
  if (running)
    return (
      <Box>
        <Typography variant="body2">
          {formatMessage({ id: "rinf_lc_bulk_batch_running" }, values)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={total === 0 ? PERCENT : (done / total) * PERCENT}
        />
      </Box>
    );
  return (
    <Alert severity={failed === 0 ? "success" : "warning"}>
      {formatMessage({ id: "rinf_lc_bulk_batch_done" }, values)}
      {firstError && ` ${errorText(firstError, formatMessage)}`}
    </Alert>
  );
};

interface BulkBatchActionsProps {
  bulkId: string;
  lines: LocationCodeRequest[];
  /** The lines ticked in the table. */
  selected: LocationCodeRequest[];
}

/**
 * What the current actor can do on the bulk request: register it whole,
 * and take a step on the ticked lines it is open to. Steps that need a
 * reason or a choice are taken in the line's own file.
 */
export const BulkBatchActions = ({
  bulkId,
  lines,
  selected,
}: BulkBatchActionsProps) => {
  const { formatMessage } = useIntl();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const { progress, register, run } = useBulkBatch(bulkId, lines, selected);
  const today = todayIsoDate();
  const isRunning = progress?.running ?? false;
  const canRegister = bulkRegistrationRefusal(lines, actor) === null;
  const stepsOn = (chosen: LocationCodeRequest[]) =>
    BATCH_ACTIONS.map((action) => ({
      action,
      count: linesReadyFor(chosen, action, actor, today).length,
    })).filter(({ count }) => count > 0);
  const steps = stepsOn(selected);
  /** Something this actor could do, if lines were ticked. */
  const hasWork = stepsOn(lines).length > 0;

  if (!canRegister && !hasWork && !progress) return null;
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
        {canRegister && (
          <Button variant="contained" disabled={isRunning} onClick={register}>
            {formatMessage(
              { id: "rinf_lc_bulk_register" },
              { count: lines.length },
            )}
          </Button>
        )}
        {steps.map(({ action, count }) => (
          <Button
            key={action}
            variant="contained"
            disabled={isRunning}
            onClick={() => run(action)}
          >
            {formatMessage(
              { id: "rinf_lc_bulk_batch_button" },
              {
                action: formatMessage({ id: `rinf_lc_bulk_batch_${action}` }),
                count,
              },
            )}
          </Button>
        ))}
      </Stack>
      {hasWork && (
        <Typography variant="body2">
          {formatMessage(
            {
              id:
                selected.length === 0
                  ? "rinf_lc_bulk_batch_select_hint"
                  : steps.length === 0
                    ? "rinf_lc_bulk_batch_selected_none_ready"
                    : "rinf_lc_bulk_batch_selected",
            },
            { count: selected.length, total: lines.length },
          )}
        </Typography>
      )}
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {formatMessage({ id: "rinf_lc_bulk_batch_note" })}
      </Typography>
      {progress && <BatchResult progress={progress} />}
    </Stack>
  );
};
