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

import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setShowOperationalPoints } from "../../state/operationalPointsSlice";
import { setShowSectionsOfLine } from "../../state/sectionsOfLineSlice";

/** Same shape as the other items in Abzu's Map preferences panel. */
export interface RinfSettingItem {
  key: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

/** On/off switches for the RINF layers, for the Map preferences panel. */
export const useRinfLayerSettingItems = (): RinfSettingItem[] => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const showOperationalPoints = useAppSelector(
    (state) => state.rinf.operationalPoints.show,
  );
  const showSectionsOfLine = useAppSelector(
    (state) => state.rinf.sectionsOfLine.show,
  );

  return [
    {
      key: "rinfOperationalPoints",
      label: formatMessage({ id: "rinf_show_operational_points" }),
      checked: showOperationalPoints,
      onChange: (value) => dispatch(setShowOperationalPoints(value)),
    },
    {
      key: "rinfSectionsOfLine",
      label: formatMessage({ id: "rinf_show_sections_of_line" }),
      checked: showSectionsOfLine,
      onChange: (value) => dispatch(setShowSectionsOfLine(value)),
    },
  ];
};
