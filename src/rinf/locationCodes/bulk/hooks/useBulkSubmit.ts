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

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { requesterErrors } from "../../checks/admissibility";
import { readRequester, writeRequester } from "../../form/requesterPreference";
import type { RequesterForm } from "../../form/RequesterFields";
import type { RequestData } from "../../model/LocationCodeRequest";
import { bulkFilePath } from "../../page/locationCodesPath";
import { submitBulkRequest } from "../../state/bulkThunks";
import { setActor } from "../../state/locationCodesSlice";
import { emptyRequestData } from "../../workflow/createRequest";
import { requestDataOfLine } from "../bulkLineToRequest";
import { acceptedLines, BulkReport } from "../bulkReport";

const NOT_SUBMITTED = "rinf_lc_bulk_error_not_submitted";

export interface BulkSubmit {
  /** The requester's details, in the shape the request form's section edits. */
  form: RequesterForm;
  confirmed: boolean;
  setConfirmed: (confirmed: boolean) => void;
  submitting: boolean;
  /** Text key or message of why the store refused the submission. */
  error: string | null;
  submit: () => void;
}

/**
 * Who asks, once for the whole file, and the submission of its accepted
 * lines as one request. The requester's details are those remembered from
 * the request form.
 */
export const useBulkSubmit = (report: BulkReport): BulkSubmit => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const [data, setData] = useState<RequestData>(() => {
    const empty = emptyRequestData();
    return {
      ...empty,
      requester: {
        ...empty.requester,
        ...readRequester(),
        ...(actor.name && { name: actor.name }),
      },
    };
  });
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errors = useMemo(() => requesterErrors(data), [data]);

  const submit = useCallback(() => {
    setAttempted(true);
    if (Object.keys(errors).length > 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    writeRequester(data.requester);
    // The submitter is whoever acts now; without a name yet, the form's.
    const submitter = {
      ...actor,
      name: actor.name || data.requester.name.trim(),
    };
    if (!actor.name) dispatch(setActor(submitter));
    const existingCodes = new Set(report.existingCodes);
    const accepted = new Set(acceptedLines(report).map(({ line }) => line));
    const lines = report.source
      .filter(({ line }) => accepted.has(line))
      .map((line) => ({
        line: line.line,
        data: requestDataOfLine(line, data, existingCodes),
      }));
    dispatch(
      submitBulkRequest({ lines, actor: submitter, fileName: report.fileName }),
    )
      .unwrap()
      .then(([first]) => navigate(bulkFilePath(first.bulk?.id ?? "")))
      .catch((failure: { message?: string }) =>
        setError(failure.message ?? NOT_SUBMITTED),
      )
      .finally(() => setSubmitting(false));
  }, [errors, submitting, data, actor, report, dispatch, navigate]);

  return {
    form: {
      data,
      update: (changes) => setData((current) => ({ ...current, ...changes })),
      updateRequester: (changes) =>
        setData((current) => ({
          ...current,
          requester: { ...current.requester, ...changes },
        })),
      errors: attempted ? errors : {},
    },
    confirmed: data.preSubmissionConfirmed,
    setConfirmed: (preSubmissionConfirmed) =>
      setData((current) => ({ ...current, preSubmissionConfirmed })),
    submitting,
    error,
    submit,
  };
};
