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

import type { CodeVersion } from "../model/CodeVersion";

/** A first version of PLC BE00001, open since 2026-01-01, for tests. */
export const aCodeVersion = (
  overrides: Partial<CodeVersion> = {},
): CodeVersion => ({
  key: "BE00001",
  version: 1,
  codeType: "primary",
  code: "BE00001",
  parentPrimaryCode: null,
  subsidiaryTypeCode: "",
  countryIsoCode: "BE",
  startValidity: "2026-01-01",
  endValidity: null,
  responsibleImCode: "0088",
  locationName: "Test",
  locationNameAscii: "Test",
  nutsCode: "",
  containerHandlingFlag: false,
  handoverPointFlag: false,
  freightPossibleFlag: false,
  freightStartValidity: null,
  freightEndValidity: null,
  passengerPossibleFlag: false,
  passengerStartValidity: null,
  passengerEndValidity: null,
  latitude: null,
  longitude: null,
  freeText: "",
  addDate: "2026-01-01T08:00:00.000Z",
  modDate: "2026-01-01T08:00:00.000Z",
  rinfLink: null,
  openedBy: {
    at: "2026-01-01T08:00:00.000Z",
    requestId: "r0",
    reference: "LC-2026-0001",
    change: "assigned",
  },
  endedBy: null,
  ...overrides,
});
