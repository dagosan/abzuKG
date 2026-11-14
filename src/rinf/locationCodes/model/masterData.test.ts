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

import { afterEach, describe, expect, it } from "vitest";
import { admissibilityErrors } from "../checks/admissibility";
import { assignableCode } from "../checks/assignableCode";
import type { CheckContext } from "../checks/checkContext";
import {
  DUPLICATE_UIC_ERROR,
  readMasterData,
  saveCountryInBrowser,
  saveSubsidiaryTypeInBrowser,
} from "../store/browserMasterData";
import { createRequest, emptyRequestData } from "../workflow/createRequest";
import { needsExternalCoordination } from "../workflow/routing";
import {
  countriesInUse,
  findCountry,
  isCountryPrefix,
  isNonEuCountry,
} from "./countries";
import { DEFAULT_COUNTRIES } from "./defaultCountries";
import { DEFAULT_SUBSIDIARY_TYPES } from "./defaultSubsidiaryTypes";
import {
  Country,
  countryErrors,
  isValidOn,
  subsidiaryTypeErrors,
  withCountry,
  withSubsidiaryType,
} from "./masterData";
import {
  currentMasterData,
  defaultMasterData,
  setCurrentMasterData,
} from "./masterDataRegistry";
import type { RequestData } from "./LocationCodeRequest";
import { countryOfRequest } from "./requestCountry";
import {
  findSubsidiaryType,
  isSubsidiaryTypeInUse,
  subsidiaryTypesInUse,
} from "./subsidiaryTypes";

const TODAY = "2026-11-10";
const SUBSIDIARY_TYPE_COUNT = 48;

const belgium = (): Country => findCountry("BE") as Country;

const useCountry = (country: Country): void =>
  setCurrentMasterData(withCountry(currentMasterData(), country));

const newPrimaryCode = (overrides: Partial<RequestData> = {}): RequestData => ({
  ...emptyRequestData(),
  country: "BE",
  ...overrides,
});

const context = (kgCountryCodes: string[]): CheckContext => ({
  today: TODAY,
  kgCountryCodes,
  kgProposedCode: null,
  kgPrimaryCode: null,
  kgSubsidiaryCodes: [],
  rinfElement: null,
  register: [],
  otherOpenRequests: [],
});

const assignable = (data: RequestData, used: string[]) =>
  assignableCode(
    createRequest("r", data, { name: "Ann", role: "requester" }, TODAY),
    context(used),
  );

afterEach(() => {
  setCurrentMasterData(defaultMasterData());
  window.localStorage.clear();
});

describe("the lists the register starts with", () => {
  it("are valid and hold each key once", () => {
    DEFAULT_COUNTRIES.forEach((country) =>
      expect(countryErrors(country), country.isoCode).toEqual([]),
    );
    DEFAULT_SUBSIDIARY_TYPES.forEach((type) =>
      expect(subsidiaryTypeErrors(type), type.code).toEqual([]),
    );
    const isoCodes = DEFAULT_COUNTRIES.map((country) => country.isoCode);
    const uicCodes = DEFAULT_COUNTRIES.flatMap((country) =>
      country.uicCode === null ? [] : [country.uicCode],
    );
    expect(new Set(isoCodes).size).toBe(isoCodes.length);
    expect(new Set(uicCodes).size).toBe(uicCodes.length);
    expect(
      new Set(DEFAULT_SUBSIDIARY_TYPES.map((type) => type.code)).size,
    ).toBe(SUBSIDIARY_TYPE_COUNT);
  });

  it("keep the countries the workflow knew, EU or not", () => {
    expect(isCountryPrefix("BE", TODAY)).toBe(true);
    expect(isCountryPrefix("EU", TODAY)).toBe(true);
    expect(isCountryPrefix("XX", TODAY)).toBe(false);
    expect(isNonEuCountry("BE")).toBe(false);
    expect(isNonEuCountry("EU")).toBe(false);
    expect(isNonEuCountry("NO")).toBe(true);
    expect(isNonEuCountry("XX")).toBe(true);
  });
});

describe("countries", () => {
  it("are refused with every reason when wrongly formed", () => {
    expect(
      countryErrors({
        isoCode: "be",
        uicCode: "8",
        name: " ",
        euMemberState: true,
        plcRangeStart: 500,
        plcRangeEnd: 100,
        validFrom: "2026-12-01",
        validTo: "2026-01-01",
      }),
    ).toEqual([
      "rinf_lc_md_error_iso",
      "rinf_lc_md_error_uic",
      "rinf_lc_md_error_name",
      "rinf_lc_md_error_range_order",
      "rinf_lc_md_error_date_order",
    ]);
    expect(countryErrors({ ...belgium(), plcRangeStart: Number.NaN })).toEqual([
      "rinf_lc_md_error_range",
    ]);
  });

  it("count the first and last valid day", () => {
    const ending = { validFrom: TODAY, validTo: TODAY };
    expect(isValidOn(ending, TODAY)).toBe(true);
    expect(isValidOn(ending, "2026-11-09")).toBe(false);
    expect(isValidOn(ending, "2026-11-11")).toBe(false);
  });

  it("leave the form once no longer valid", () => {
    useCountry({ ...belgium(), validTo: "2026-11-09" });
    expect(isCountryPrefix("BE", TODAY)).toBe(false);
    expect(
      countriesInUse(TODAY).map((country) => country.isoCode),
    ).not.toContain("BE");
    expect(countriesInUse("2026-11-09")[0].isoCode).toBe("AL");
  });

  it("decide external coordination by their EU flag", () => {
    const request = (country: string) =>
      createRequest(
        "r",
        newPrimaryCode({ country }),
        { name: "Ann", role: "requester" },
        TODAY,
      );
    expect(needsExternalCoordination(request("NO"))).toBe(true);
    expect(needsExternalCoordination(request("BE"))).toBe(false);
    useCountry({ ...belgium(), euMemberState: false });
    expect(needsExternalCoordination(request("BE"))).toBe(true);
  });
});

describe("the country of a request", () => {
  it("is the prefix of the PLC concerned when the form did not ask for it", () => {
    const subsidiary = {
      ...emptyRequestData(),
      codeType: "subsidiary" as const,
      parentPrimaryCode: "no00198",
    };
    expect(countryOfRequest(subsidiary)).toBe("NO");
    expect(
      countryOfRequest({
        ...emptyRequestData(),
        operation: "deactivation",
        targetCode: "BE00438",
      }),
    ).toBe("BE");
    expect(countryOfRequest(newPrimaryCode({ country: "FR" }))).toBe("FR");
    expect(countryOfRequest(emptyRequestData())).toBe("");
    const request = createRequest(
      "r",
      subsidiary,
      { name: "Ann", role: "requester" },
      TODAY,
    );
    expect(needsExternalCoordination(request)).toBe(true);
  });
});

describe("the range for new PLCs", () => {
  it("gives the lowest free number of the range", () => {
    expect(assignable(newPrimaryCode(), ["BE00001"])).toBe("BE00002");
    useCountry({ ...belgium(), plcRangeStart: 100, plcRangeEnd: 200 });
    expect(assignable(newPrimaryCode(), ["BE00001", "BE00100"])).toBe(
      "BE00101",
    );
  });

  it("does not assign a proposed number outside it, but registers an existing code", () => {
    useCountry({ ...belgium(), plcRangeStart: 100, plcRangeEnd: 200 });
    expect(assignable(newPrimaryCode({ proposedCode: "BE00050" }), [])).toBe(
      "BE00100",
    );
    expect(assignable(newPrimaryCode({ proposedCode: "BE00150" }), [])).toBe(
      "BE00150",
    );
    expect(
      assignable(
        newPrimaryCode({ operation: "existingCode", proposedCode: "BE00050" }),
        [],
      ),
    ).toBe("BE00050");
  });

  it("is checked on the form for a new code only", () => {
    useCountry({ ...belgium(), plcRangeStart: 100, plcRangeEnd: 200 });
    const errorOf = (overrides: Partial<RequestData>) =>
      admissibilityErrors(newPrimaryCode(overrides)).proposedCode;
    expect(errorOf({ proposedCode: "BE00050" })).toBe(
      "rinf_lc_error_code_range",
    );
    expect(errorOf({ proposedCode: "BE00150" })).toBeUndefined();
    expect(
      errorOf({ operation: "existingCode", proposedCode: "BE00050" }),
    ).toBeUndefined();
  });
});

describe("subsidiary types", () => {
  it("offer the types in use, without 00", () => {
    const codes = subsidiaryTypesInUse(TODAY).map((type) => type.code);
    expect(codes).toHaveLength(SUBSIDIARY_TYPE_COUNT - 1);
    expect(codes).not.toContain("00");
    expect(codes).toContain("21");
    expect(isSubsidiaryTypeInUse("02", TODAY)).toBe(false);
  });

  it("keep the name of a type no longer in use", () => {
    const track = findSubsidiaryType("01");
    if (!track) throw new Error("type 01 is missing");
    setCurrentMasterData(
      withSubsidiaryType(currentMasterData(), {
        ...track,
        validTo: "2026-10-31",
      }),
    );
    expect(isSubsidiaryTypeInUse("01", TODAY)).toBe(false);
    expect(findSubsidiaryType("01")?.name).toBe("Track");
  });
});

describe("the browser's master data", () => {
  it("starts with the built-in lists and keeps what is saved", () => {
    expect(readMasterData().countries).toHaveLength(DEFAULT_COUNTRIES.length);
    saveCountryInBrowser({ ...belgium(), plcRangeStart: 100 });
    saveSubsidiaryTypeInBrowser({
      code: "02",
      name: "New type",
      requesterRoles: [],
      retailRelated: false,
      validFrom: null,
      validTo: null,
    });
    const saved = readMasterData();
    expect(saved.countries).toHaveLength(DEFAULT_COUNTRIES.length);
    expect(
      saved.countries.find((country) => country.isoCode === "BE")
        ?.plcRangeStart,
    ).toBe(100);
    expect(saved.subsidiaryTypes).toHaveLength(SUBSIDIARY_TYPE_COUNT + 1);
  });

  it("refuses a UIC code another country has", () => {
    expect(() => saveCountryInBrowser({ ...belgium(), isoCode: "XX" })).toThrow(
      DUPLICATE_UIC_ERROR,
    );
  });
});
