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

Added for the ERA RINF frontend, 2026-11-02. */

import type { ReactNode } from "react";
import type { IntlShape } from "react-intl";
import { CRD_FLAGS, crdOf, RequestData } from "../model/LocationCodeRequest";

/** The CRD columns a request gives, as label–value lines; empty ones are dropped later. */
export const crdFacts = (
  data: RequestData,
  formatMessage: IntlShape["formatMessage"],
): [string, ReactNode][] => {
  const crd = crdOf(data);
  const position =
    crd.latitude.trim() && crd.longitude.trim()
      ? `${crd.latitude.trim()}, ${crd.longitude.trim()}`
      : "";
  return [
    ["rinf_lc_crd_locationNameAscii", crd.locationNameAscii],
    ["rinf_lc_crd_nutsCode", crd.nutsCode],
    ["rinf_lc_crd_position", position],
    ...CRD_FLAGS.map((flag): [string, ReactNode] => [
      `rinf_lc_crd_${flag}`,
      crd[flag] === null
        ? ""
        : formatMessage({
            id: crd[flag] ? "rinf_lc_crd_yes" : "rinf_lc_crd_no",
          }),
    ]),
    ["rinf_lc_crd_freeText", crd.freeText],
  ];
};
