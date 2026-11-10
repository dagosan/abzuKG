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

import { Country, FIRST_RANGE_NUMBER, LAST_RANGE_NUMBER } from "./masterData";

const country = (
  isoCode: string,
  uicCode: string | null,
  name: string,
  euMemberState: boolean,
): Country => ({
  isoCode,
  uicCode,
  name,
  euMemberState,
  plcRangeStart: FIRST_RANGE_NUMBER,
  plcRangeEnd: LAST_RANGE_NUMBER,
  validFrom: null,
  validTo: null,
});

/**
 * The countries the register starts with (Tiamat: DefaultMasterData.java,
 * the same list): the prefixes PLCs carry in the ERA Knowledge Graph and in
 * CRD, ISO 3166 alpha-2 plus "EU" for border points declared jointly, with
 * the UIC country code (code list B.9.1) where the country has one. Used
 * until the store's master data has loaded, and by the browser store.
 */
export const DEFAULT_COUNTRIES: Country[] = [
  country("AT", "81", "Austria", true),
  country("BE", "88", "Belgium", true),
  country("BG", "52", "Bulgaria", true),
  country("CZ", "54", "Czechia", true),
  country("DE", "80", "Germany", true),
  country("DK", "86", "Denmark", true),
  country("EE", "26", "Estonia", true),
  country("ES", "71", "Spain", true),
  country("FI", "10", "Finland", true),
  country("FR", "87", "France", true),
  country("GR", "73", "Greece", true),
  country("HR", "78", "Croatia", true),
  country("HU", "55", "Hungary", true),
  country("IE", "60", "Ireland", true),
  country("IT", "83", "Italy", true),
  country("LT", "24", "Lithuania", true),
  country("LU", "82", "Luxembourg", true),
  country("LV", "25", "Latvia", true),
  country("NL", "84", "Netherlands", true),
  country("PL", "51", "Poland", true),
  country("PT", "94", "Portugal", true),
  country("RO", "53", "Romania", true),
  country("SE", "74", "Sweden", true),
  country("SI", "79", "Slovenia", true),
  country("SK", "56", "Slovakia", true),
  country("EU", null, "Border points declared jointly (EU)", true),
  country("AL", "41", "Albania", false),
  country("BA", "49", "Bosnia and Herzegovina", false),
  country("BY", "21", "Belarus", false),
  country("CH", "85", "Switzerland", false),
  country("GB", "70", "United Kingdom", false),
  country("LI", null, "Liechtenstein", false),
  country("MD", "23", "Moldova", false),
  country("ME", "62", "Montenegro", false),
  country("MK", "65", "North Macedonia", false),
  country("NO", "76", "Norway", false),
  country("RS", "72", "Serbia", false),
  country("TR", "75", "Türkiye", false),
  country("UA", "22", "Ukraine", false),
];
