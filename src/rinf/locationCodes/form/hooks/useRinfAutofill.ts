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
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { todayIsoDate } from "../../../api/queryParts";
import { useRinfSparqlEndpoint } from "../../../config/rinfEndpoint";
import type { RequestField } from "../../checks/admissibility";
import { fetchElement } from "../../checks/kgLookups";
import type { RequestData, RinfLink } from "../../model/LocationCodeRequest";
import { elementOfLink } from "../../model/rinfLink";
import { autofillFromRinf, RinfNotice } from "../rinfAutofill";

export interface RinfAutofillState {
  /** Sets the element and fills the form from RINF; null clears it. */
  chooseRinfElement: (link: RinfLink | null) => void;
  /** Fields filled in from RINF and not edited since. */
  fromRinf: RequestField[];
  /** Forgets that these fields came from RINF (the user edited them). */
  forgetFromRinf: (fields: string[]) => void;
  notice: RinfNotice | null;
  loading: boolean;
}

/**
 * Looks the chosen element up in RINF (~0.6 s; for an asset, the OP or
 * section of line it belongs to) and fills in what RINF says about it.
 */
export const useRinfAutofill = (
  dataRef: MutableRefObject<RequestData>,
  setData: Dispatch<SetStateAction<RequestData>>,
): RinfAutofillState => {
  const endpoint = useRinfSparqlEndpoint();
  const [fromRinf, setFromRinf] = useState<RequestField[]>([]);
  const [notice, setNotice] = useState<RinfNotice | null>(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const chooseRinfElement = useCallback(
    (link: RinfLink | null) => {
      controllerRef.current?.abort();
      setData((current) => ({ ...current, rinfLink: link }));
      setNotice(null);
      setFromRinf([]);
      const element = link ? elementOfLink(link) : null;
      if (!link || !element) return;
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoading(true);
      fetchElement(
        endpoint,
        element.kind,
        element.canonicalId,
        todayIsoDate(),
        controller.signal,
      )
        .then((found) => {
          const fill = autofillFromRinf(dataRef.current, link, found);
          setData((current) => ({ ...current, ...fill.changes }));
          setFromRinf(fill.filled);
          setNotice(fill.notice);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setNotice({ id: "rinf_lc_autofill_failed", severity: "warning" });
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    },
    [endpoint, dataRef, setData],
  );

  const forgetFromRinf = useCallback(
    (fields: string[]) =>
      setFromRinf((current) =>
        current.filter((field) => !fields.includes(field)),
      ),
    [],
  );

  return { chooseRinfElement, fromRinf, forgetFromRinf, notice, loading };
};
