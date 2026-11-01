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

Added for the ERA RINF frontend, 2026-11-01. */

import { useAppSelector } from "../../../store/hooks";
import { useMapZoom } from "../hooks/useMapZoom";
import { codeLabelsDrawable } from "./codeLabelZoom";
import { CodeLabelMarker } from "./CodeLabelMarker";
import { useCodeLabels } from "./hooks/useCodeLabels";

/**
 * Location codes next to the OPs and SoLs in view: the codes RINF gives them
 * and the codes in the register, styled by source (see CodeChip).
 */
export const RinfLocationCodesLayer = () => {
  const show = useAppSelector((state) => state.rinf.locationCodeLabels.show);
  const zoom = useMapZoom();
  const { labels } = useCodeLabels(show);

  if (!show || !codeLabelsDrawable(zoom, labels.length)) return null;

  return (
    <>
      {labels.map((label) => (
        <CodeLabelMarker
          key={`${label.kind}:${label.canonicalId}`}
          label={label}
        />
      ))}
    </>
  );
};
