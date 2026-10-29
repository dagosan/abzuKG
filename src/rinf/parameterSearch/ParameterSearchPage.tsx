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

import { useCallback } from "react";
import { Helmet } from "react-helmet";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { detailsPath } from "../detailsKinds";
import type { PlaceMatch } from "../models/parameterMatches";
import { clearParameterSearch } from "../state/parameterSearchSlice";
import { useParameterProfile } from "./hooks/useParameterProfile";
import { useParameterSearchForm } from "./hooks/useParameterSearchForm";
import { useRunSubmittedSearch } from "./hooks/useRunSubmittedSearch";
import { ParameterSearchFormView } from "./ParameterSearchFormView";
import { ParameterSearchPanel } from "./ParameterSearchPanel";
import { ResultsSection } from "./ResultsSection";

/**
 * Route /parameter-search — find every element whose parameter has a given
 * value, shown by the section of line or OP it belongs to.
 */
export const ParameterSearchPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const form = useParameterSearchForm();
  const profile = useParameterProfile(form.draft);
  useRunSubmittedSearch(form.submitted);

  const handleOpen = useCallback(
    ({ kind, canonicalId }: PlaceMatch) =>
      navigate(detailsPath(kind, canonicalId)),
    [navigate],
  );

  const handleClose = useCallback(() => {
    dispatch(clearParameterSearch());
    navigate("/");
  }, [dispatch, navigate]);

  return (
    <>
      <Helmet title={formatMessage({ id: "rinf_parameter_search_title" })} />
      <ParameterSearchPanel
        form={<ParameterSearchFormView form={form} profile={profile} />}
        results={<ResultsSection onOpen={handleOpen} />}
        onClose={handleClose}
      />
    </>
  );
};
