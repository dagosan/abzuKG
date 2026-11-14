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

Added for the ERA RINF frontend, 2026-10-29.
Modified 2026-11-02: register as code versions with CRD's columns.
Modified 2026-11-09: a position chosen on the map is kept.
Modified 2026-11-14: clearing the element ends the "loading" of a lookup under way. */

import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAppSelector } from "../../../../store/hooks";
import { todayIsoDate } from "../../../api/queryParts";
import { useRinfSparqlEndpoint } from "../../../config/rinfEndpoint";
import type { RequestField } from "../../checks/admissibility";
import { fetchElement } from "../../checks/kgLookups";
import { fetchElementPosition } from "../../checks/kgPosition";
import { holdsMapPosition } from "../../mapLocation/mapPosition";
import {
  crdOf,
  type RequestData,
  type RinfLink,
} from "../../model/LocationCodeRequest";
import { elementOfLink } from "../../model/rinfLink";
import { autofillFromRinf, CodeChoiceField, RinfNotice } from "../rinfAutofill";

export interface RinfAutofillState {
  /** Sets the element and fills the form from RINF; null clears it. */
  chooseRinfElement: (link: RinfLink | null) => void;
  /** Fields filled in from RINF and not edited since. */
  fromRinf: RequestField[];
  /** Forgets that these fields came from RINF (the user edited them). */
  forgetFromRinf: (fields: string[]) => void;
  notice: RinfNotice | null;
  loading: boolean;
  /** Puts one of the element's codes in the field the notice offers it for. */
  applyRinfChoice: (field: CodeChoiceField, code: string) => void;
}

/**
 * Looks the chosen element up in RINF (~0.6 s; for an asset, the OP or
 * section of line it belongs to) and fills in what RINF says about it,
 * with its position for a PLC.
 */
export const useRinfAutofill = (
  dataRef: MutableRefObject<RequestData>,
  setData: Dispatch<SetStateAction<RequestData>>,
): RinfAutofillState => {
  const endpoint = useRinfSparqlEndpoint();
  const positionFromMap = useAppSelector(
    (state) => state.rinf.locationCodes.positionFromMap,
  );
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
      if (!link || !element) {
        setLoading(false);
        return;
      }
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoading(true);
      // A point chosen on the map stays: the element is only its reference.
      const wantsPosition =
        dataRef.current.codeType === "primary" &&
        !holdsMapPosition(crdOf(dataRef.current), positionFromMap);
      Promise.all([
        fetchElement(
          endpoint,
          element.kind,
          element.canonicalId,
          todayIsoDate(),
          controller.signal,
        ),
        // CRD's Latitude and Longitude; a failure here only leaves them blank.
        wantsPosition
          ? fetchElementPosition(
              endpoint,
              element.kind,
              element.canonicalId,
              controller.signal,
            ).catch(() => null)
          : null,
      ])
        .then(([found, position]) => {
          const fill = autofillFromRinf(dataRef.current, link, found, position);
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
    [endpoint, dataRef, setData, positionFromMap],
  );

  const forgetFromRinf = useCallback(
    (fields: string[]) =>
      setFromRinf((current) =>
        current.filter((field) => !fields.includes(field)),
      ),
    [],
  );

  const applyRinfChoice = useCallback(
    (field: CodeChoiceField, code: string) => {
      setData((current) => ({ ...current, [field]: code }));
      setFromRinf((current) =>
        current.includes(field) ? current : [...current, field],
      );
    },
    [setData],
  );

  return {
    chooseRinfElement,
    fromRinf,
    forgetFromRinf,
    notice,
    loading,
    applyRinfChoice,
  };
};
