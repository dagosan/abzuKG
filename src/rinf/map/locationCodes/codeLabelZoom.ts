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

/** From this zoom the labels are drawn; further out they cover each other. */
export const CODE_LABELS_MIN_ZOOM = 11;
/** More labels than this in view are not drawn (a dense node); zooming in brings them. */
export const CODE_LABELS_MAX_COUNT = 400;

export const codeLabelsDrawable = (zoom: number, count: number): boolean =>
  zoom >= CODE_LABELS_MIN_ZOOM && count <= CODE_LABELS_MAX_COUNT;
