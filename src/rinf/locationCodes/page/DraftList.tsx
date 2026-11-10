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

Added for the ERA Location Code Manager, 2026-11-10. */

import {
  Box,
  Button,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { CODE_TYPE_ABBREVIATIONS } from "../model/codeTypes";
import type { RequestDraft } from "../model/RequestDraft";
import { deleteRequestDraft } from "../state/draftThunks";
import { draftPath } from "./locationCodesPath";

const NO_SUBJECT = "—";

/** What a draft is about, in a few words: a name or the code concerned. */
const draftSubject = ({ data }: RequestDraft): string =>
  data.locationName.trim() ||
  data.targetCode.trim() ||
  data.proposedCode.trim() ||
  NO_SUBJECT;

interface DraftListProps {
  drafts: RequestDraft[];
}

/** The requester's drafts: continue one in the form, or discard it. */
export const DraftList = ({ drafts }: DraftListProps) => {
  const { formatMessage, formatDate } = useIntl();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const owner = useAppSelector((state) => state.rinf.locationCodes.actor.name);

  if (drafts.length === 0) return null;
  return (
    <Box component="section" sx={{ mb: 3 }}>
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
        {formatMessage({ id: "rinf_lc_drafts_title" })}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
        {formatMessage({ id: "rinf_lc_drafts_hint" })}
      </Typography>
      <Paper variant="outlined">
        <List disablePadding>
          {drafts.map((draft) => (
            <ListItem
              key={draft.id}
              divider
              sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {CODE_TYPE_ABBREVIATIONS[draft.data.codeType]}{" "}
                  {formatMessage({
                    id: `rinf_lc_operation_${draft.data.operation}`,
                  })}
                  {" · "}
                  {formatMessage(
                    { id: "rinf_lc_draft_saved_at" },
                    {
                      when: formatDate(draft.savedAt, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                    },
                  )}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {draftSubject(draft)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(draftPath(draft.id))}
                >
                  {formatMessage({ id: "rinf_lc_draft_continue" })}
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() =>
                    dispatch(deleteRequestDraft({ id: draft.id, owner }))
                  }
                >
                  {formatMessage({ id: "rinf_lc_draft_discard" })}
                </Button>
              </Stack>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};
