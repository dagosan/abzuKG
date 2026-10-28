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

import { useCallback, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useRinfSparqlEndpoint } from "../config/rinfEndpoint";
import { sectionOfLineName } from "../models/labels";
import { SectionOfLinePanel } from "../panel/SectionOfLinePanel";
import { SECTION_OF_LINE_PARAM } from "../routes";
import { fetchParameterDictionary } from "../state/parameterDictionarySlice";
import {
  closeSectionOfLineDetails,
  fetchSectionOfLineDetails,
} from "../state/sectionOfLineDetailsSlice";

/**
 * Route /section-of-line/:canonicalId — loads the SoL valid today and shows
 * its parameters beside the map, as the stop place route does for stops.
 */
export const SectionOfLinePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const endpoint = useRinfSparqlEndpoint();
  const params = useParams<Record<string, string>>();
  const canonicalId = params[SECTION_OF_LINE_PARAM] ?? "";
  const details = useAppSelector(
    (state) => state.rinf.sectionOfLineDetails.details,
  );
  const name = details ? sectionOfLineName(details.label) : canonicalId;

  useEffect(() => {
    dispatch(fetchParameterDictionary(endpoint));
  }, [dispatch, endpoint]);

  useEffect(() => {
    if (!canonicalId) return;
    const request = dispatch(
      fetchSectionOfLineDetails({ endpoint, canonicalId }),
    );
    return () => request.abort();
  }, [dispatch, endpoint, canonicalId]);

  useEffect(
    () => () => {
      dispatch(closeSectionOfLineDetails());
    },
    [dispatch],
  );

  const handleClose = useCallback(() => navigate("/"), [navigate]);

  return (
    <>
      <Helmet title={name} />
      <SectionOfLinePanel
        canonicalId={canonicalId}
        name={name}
        onClose={handleClose}
      />
    </>
  );
};
