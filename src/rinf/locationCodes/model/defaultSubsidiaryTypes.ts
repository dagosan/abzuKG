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

Added for the ERA Location Code Manager, 2026-11-10. */

import type { EntitledParty, SubsidiaryType } from "./masterData";

const IM: EntitledParty = "infrastructureManager";
const RU: EntitledParty = "railwayUndertaking";
const STATION_MANAGER: EntitledParty = "stationManager";
const TERMINAL_MANAGER: EntitledParty = "terminalManager";
const OWNER: EntitledParty = "owner";

const type = (
  code: string,
  name: string,
  requesterRoles: EntitledParty[],
): SubsidiaryType => ({
  code,
  name,
  requesterRoles,
  retailRelated: false,
  validFrom: null,
  validTo: null,
});

const retail = (subsidiaryType: SubsidiaryType): SubsidiaryType => ({
  ...subsidiaryType,
  retailRelated: true,
});

/**
 * The subsidiary types the register starts with (Tiamat:
 * DefaultMasterData.java, the same list): the 48 values of the XSD attribute
 * LocationSubsidiaryTypeCode (release 4.0.0), with the requester of TD 103
 * v4.0, Table 6, as the LCMS specification 5.5 lists them. 39 and 40 name no
 * party in TD 103; the procedure gives the RU, followed here. 21 and 66 are
 * not in Table 6.
 */
export const DEFAULT_SUBSIDIARY_TYPES: SubsidiaryType[] = [
  type("00", "Not defined", []),
  type("01", "Track", [IM]),
  retail(type("03", "Border point code", [RU])),
  type("04", "Sorting code", [IM, RU]),
  type("05", "Vehicle parking points", [IM]),
  type("06", "Public loading places", [IM]),
  type("07", "Private loading places", [OWNER]),
  type("09", "Depot / maintenance workshop", [OWNER]),
  type("10", "Switch/turnout", [IM]),
  type("15", "Platform", [STATION_MANAGER, IM]),
  type("21", "Building", []),
  type("22", "Level crossing", [IM]),
  type("23", "Bridge", [IM]),
  type("24", "Tunnel", [IM]),
  type("25", "Underpass", [STATION_MANAGER, IM]),
  type("27", "Signal", [IM]),
  type("28", "Sign and board", [IM]),
  type("29", "Phase break", [IM]),
  type("33", "Hot spot detector", [IM]),
  type("36", "Freight yard", [RU]),
  type("37", "Loading point", [RU]),
  retail(type("39", "Reservation code", [RU])),
  retail(type("40", "Metastation", [RU])),
  type("41", "Company specific identifier", [OWNER]),
  type("42", "DIUM station", [RU]),
  type("43", "Passenger cars loading", [OWNER]),
  type("45", "Sewage dump", [OWNER]),
  type("46", "Refuelling point", [OWNER]),
  type("47", "Mains supply", [OWNER]),
  type("48", "Water supply", [OWNER]),
  type("50", "Indoor cleaning platform", [OWNER]),
  type("51", "Car-wash plant", [OWNER]),
  type("52", "Short dry-cleaning track", [OWNER]),
  type("54", "Sand-filling station", [OWNER]),
  type("56", "Signal box", [IM]),
  type("57", "Intermodal terminal", [OWNER]),
  type("58", "OSJD system based location", [RU]),
  type("59", "Train service substitute stop", [OWNER]),
  type("60", "Multifunctional rail terminal", [TERMINAL_MANAGER, IM]),
  type("61", "Relief facility", [IM]),
  type("66", "Location ENEE code", []),
  type("70", "Network border", [IM]),
  type("71", "State border", [IM]),
  type("72", "Administrative border", [IM]),
  type("74", "Operational handover", [IM]),
  type("75", "Planning handover", [IM]),
  type("76", "Other technical facility", [IM]),
  type("99", "Relation to station", []),
];
