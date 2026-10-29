import { describe, expect, it } from "vitest";
import type { KgElement } from "../checks/kgLookups";
import type { RequestData, RinfLink } from "../model/LocationCodeRequest";
import { emptyRequestData } from "../workflow/createRequest";
import { autofillFromRinf } from "./rinfAutofill";

const gembloux: KgElement = {
  exists: true,
  validToday: true,
  label: "Gembloux",
  codes: ["BE00438"],
  declarations: [
    {
      imCode: "0088",
      countryPrefix: "BE",
      name: "Gembloux",
      codes: ["BE00438"],
    },
  ],
};
const myrbacken: KgElement = {
  exists: true,
  validToday: true,
  label: "TRV-Atrain border Myrbacken",
  codes: [],
  declarations: [
    {
      imCode: "0074",
      countryPrefix: "SE",
      name: "TRV-Atrain border Myrbacken",
      codes: [],
    },
  ],
};
const op = (id: string, label: string): RinfLink => ({
  kind: "operationalPoint",
  canonicalId: id,
  label,
});
const track: RinfLink = {
  kind: "asset",
  canonicalId: "http://data.europa.eu/949/track/0088_BELGB_voie-III",
  label: "Gembloux voie III - Section 3378",
  assetClass: "Running track",
  assetClassUri: "http://data.europa.eu/949/RunningTrack",
  parent: { kind: "operationalPoint", canonicalId: "BELGB", label: "Gembloux" },
};
const data = (overrides: Partial<RequestData> = {}): RequestData => ({
  ...emptyRequestData(),
  ...overrides,
});

describe("filling the form from RINF", () => {
  it("fills name, country and IM of a new PLC", () => {
    const fill = autofillFromRinf(
      data(),
      op("SE00111", "Myrbacken"),
      myrbacken,
    );
    expect(fill.changes).toEqual({
      locationName: "TRV-Atrain border Myrbacken",
      country: "SE",
      imOrganisationCode: "0074",
    });
    expect(fill.filled.sort()).toEqual([
      "country",
      "imOrganisationCode",
      "locationName",
    ]);
    expect(fill.notice).toBeNull();
  });

  it("warns that the OP already has a PLC when a new one is asked", () => {
    const fill = autofillFromRinf(data(), op("BELGB", "Gembloux"), gembloux);
    expect(fill.notice?.id).toBe("rinf_lc_autofill_already_coded");
  });

  it("takes the existing code for an amendment or a first population", () => {
    expect(
      autofillFromRinf(
        data({ operation: "amendment" }),
        op("BELGB", "Gembloux"),
        gembloux,
      ).changes,
    ).toEqual({ targetCode: "BE00438" });
    expect(
      autofillFromRinf(
        data({ operation: "existingCode" }),
        op("BELGB", "Gembloux"),
        gembloux,
      ).changes.proposedCode,
    ).toBe("BE00438");
  });

  it("fills parent PLC, type and name of an SLC on a track", () => {
    const fill = autofillFromRinf(
      data({ codeType: "subsidiary" }),
      track,
      gembloux,
    );
    expect(fill.changes).toEqual({
      parentPrimaryCode: "BE00438",
      locationName: "Gembloux voie III - Section 3378",
      subsidiaryTypeCode: "01",
    });
  });

  it("fills only the name of a border point declared by two IMs", () => {
    const border: KgElement = {
      exists: true,
      validToday: true,
      label: "Perl Grenze",
      codes: ["FR01092", "DE18314"],
      declarations: [
        {
          imCode: "0087",
          countryPrefix: "FR",
          name: "Frontière FR - DE",
          codes: ["FR01092"],
        },
        {
          imCode: "0080",
          countryPrefix: "DE",
          name: "Perl Grenze",
          codes: ["DE18314"],
        },
      ],
    };
    const fill = autofillFromRinf(data(), op("EU00010", "Perl Grenze"), border);
    expect(fill.changes).toEqual({ locationName: "Perl Grenze" });
    expect(fill.notice?.id).toBe("rinf_lc_autofill_several_ims");
  });
});
