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

import {
  Country,
  FIRST_RANGE_NUMBER,
  LAST_RANGE_NUMBER,
} from "../model/masterData";

/** A country as typed in the dialog: numbers and dates still text. */
export interface CountryDraft {
  isoCode: string;
  uicCode: string;
  name: string;
  euMemberState: boolean;
  plcRangeStart: string;
  plcRangeEnd: string;
  validFrom: string;
  validTo: string;
}

export const draftOfCountry = (country: Country | null): CountryDraft => ({
  isoCode: country?.isoCode ?? "",
  uicCode: country?.uicCode ?? "",
  name: country?.name ?? "",
  euMemberState: country?.euMemberState ?? true,
  plcRangeStart: String(country?.plcRangeStart ?? FIRST_RANGE_NUMBER),
  plcRangeEnd: String(country?.plcRangeEnd ?? LAST_RANGE_NUMBER),
  validFrom: country?.validFrom ?? "",
  validTo: country?.validTo ?? "",
});

/** Digits only become a number; anything else is not one (NaN), and refused. */
const wholeNumber = (text: string): number =>
  /^\d+$/.test(text.trim()) ? Number(text.trim()) : Number.NaN;

export const countryOfDraft = (draft: CountryDraft): Country => ({
  isoCode: draft.isoCode.trim().toUpperCase(),
  uicCode: draft.uicCode.trim() || null,
  name: draft.name.trim(),
  euMemberState: draft.euMemberState,
  plcRangeStart: wholeNumber(draft.plcRangeStart),
  plcRangeEnd: wholeNumber(draft.plcRangeEnd),
  validFrom: draft.validFrom || null,
  validTo: draft.validTo || null,
});
