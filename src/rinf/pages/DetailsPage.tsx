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
import {
  CANONICAL_ID_PARAM,
  DetailsKind,
  DETAILS_KINDS,
} from "../detailsKinds";
import { DetailsPanel } from "../panel/DetailsPanel";
import { closeDetails, fetchDetails } from "../state/detailsSlice";
import { fetchParameterDictionary } from "../state/parameterDictionarySlice";
import { useMoveMapToElement } from "./hooks/useMoveMapToElement";

interface DetailsPageProps {
  kind: DetailsKind;
}

/**
 * Route /<kind>/:canonicalId — loads the element valid today and shows its
 * parameters beside the map, as the stop place route does for stops.
 */
export const DetailsPage = ({ kind }: DetailsPageProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const endpoint = useRinfSparqlEndpoint();
  const params = useParams<Record<string, string>>();
  const canonicalId = params[CANONICAL_ID_PARAM] ?? "";
  const firstRoot = useAppSelector((state) => state.rinf.details.roots[0]);
  const name = firstRoot?.label
    ? DETAILS_KINDS[kind].displayName(firstRoot.label)
    : canonicalId;

  useMoveMapToElement(kind, firstRoot?.position ?? null);

  useEffect(() => {
    dispatch(fetchParameterDictionary(endpoint));
  }, [dispatch, endpoint]);

  useEffect(() => {
    if (!canonicalId) return;
    const request = dispatch(fetchDetails({ endpoint, kind, canonicalId }));
    return () => request.abort();
  }, [dispatch, endpoint, kind, canonicalId]);

  useEffect(
    () => () => {
      dispatch(closeDetails());
    },
    [dispatch],
  );

  const handleClose = useCallback(() => navigate("/"), [navigate]);

  return (
    <>
      <Helmet title={name} />
      <DetailsPanel
        kind={kind}
        canonicalId={canonicalId}
        name={name}
        onClose={handleClose}
      />
    </>
  );
};
