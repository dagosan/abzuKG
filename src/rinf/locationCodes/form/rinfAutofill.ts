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

Added for the ERA RINF frontend, 2026-10-29. */

import { ERA_NAMESPACE } from "../../api/queryParts";
import type { RequestField } from "../checks/admissibility";
import type { KgElement } from "../checks/kgLookups";
import { isCreation } from "../model/codeTypes";
import type { RequestData, RinfLink } from "../model/LocationCodeRequest";

/** TD 103 Table 6 type of each asset class. A siding may be a public loading
 *  place (06) or a private siding (07): the requester chooses. */
const SUBSIDIARY_TYPE_OF_CLASS: Record<string, string> = {
  [`${ERA_NAMESPACE}RunningTrack`]: "01",
  [`${ERA_NAMESPACE}Switch`]: "10",
  [`${ERA_NAMESPACE}PlatformEdge`]: "15",
  [`${ERA_NAMESPACE}Tunnel`]: "24",
  [`${ERA_NAMESPACE}Signal`]: "27",
};

/** A message under the RINF element: text key and its values. */
export interface RinfNotice {
  id: string;
  values?: Record<string, string>;
  severity: "info" | "warning";
}

export interface RinfAutofill {
  changes: Partial<RequestData>;
  /** The fields filled in, to mark them "from RINF". */
  filled: RequestField[];
  notice: RinfNotice | null;
}

const onlyOne = (values: string[]): string | null =>
  values.length === 1 ? values[0] : null;

const distinct = (values: (string | null)[]): string[] => [
  ...new Set(values.filter((value): value is string => Boolean(value))),
];

/** "0087 (FR01092), 0080 (DE18314)" for a border point. */
const declarationList = (element: KgElement): string =>
  element.declarations
    .map(({ imCode, codes }) => `${imCode} (${codes.join(", ") || "—"})`)
    .join(", ");

/**
 * What the form takes over from RINF once the element is chosen. Only what
 * RINF says unambiguously is filled in: a border point declared by two IMs
 * gives its name only, and a notice lists the declarations.
 */
export const autofillFromRinf = (
  data: RequestData,
  link: RinfLink,
  element: KgElement,
): RinfAutofill => {
  const { declarations, codes } = element;
  const single = declarations.length === 1 ? declarations[0] : null;
  const code = onlyOne(codes);
  const country = onlyOne(
    distinct(declarations.map((each) => each.countryPrefix)),
  );
  const name = single?.name ?? element.label ?? link.label;
  const borderNotice: RinfNotice | null =
    declarations.length > 1
      ? {
          id: "rinf_lc_autofill_several_ims",
          values: { declarations: declarationList(element) },
          severity: "warning",
        }
      : null;
  const changes: Partial<RequestData> =
    data.codeType === "primary"
      ? primaryChanges(data, {
          name,
          country,
          imCode: single?.imCode ?? null,
          code,
        })
      : subsidiaryChanges(data, link, code);
  const filled = (Object.keys(changes) as (keyof RequestData)[]).filter(
    (key): key is RequestField & keyof RequestData => key !== "rinfLink",
  ) as RequestField[];
  return {
    changes,
    filled,
    notice: borderNotice ?? noticeFor(data, link, codes),
  };
};

interface PrimaryFacts {
  name: string;
  country: string | null;
  imCode: string | null;
  code: string | null;
}

const primaryChanges = (
  data: RequestData,
  { name, country, imCode, code }: PrimaryFacts,
): Partial<RequestData> => {
  if (!isCreation(data.operation)) return code ? { targetCode: code } : {};
  return {
    locationName: name,
    ...(country && { country }),
    ...(imCode && { imOrganisationCode: imCode }),
    ...(data.operation === "existingCode" && code && { proposedCode: code }),
  };
};

const subsidiaryChanges = (
  data: RequestData,
  link: RinfLink,
  code: string | null,
): Partial<RequestData> => {
  const type = link.assetClassUri
    ? SUBSIDIARY_TYPE_OF_CLASS[link.assetClassUri]
    : undefined;
  const isAsset = link.kind === "asset";
  return {
    ...(code && { parentPrimaryCode: code }),
    ...(isAsset && isCreation(data.operation) && { locationName: link.label }),
    ...(isAsset &&
      type &&
      isCreation(data.operation) && { subsidiaryTypeCode: type }),
  };
};

/** What to tell the user about the codes RINF already holds. */
const noticeFor = (
  data: RequestData,
  link: RinfLink,
  codes: string[],
): RinfNotice | null => {
  const listed = codes.join(", ");
  if (data.codeType === "subsidiary") {
    if (codes.length === 0)
      return { id: "rinf_lc_autofill_no_parent", severity: "warning" };
    return codes.length > 1
      ? {
          id: "rinf_lc_autofill_several_codes",
          values: { codes: listed },
          severity: "warning",
        }
      : null;
  }
  if (data.operation === "newCode" && codes.length > 0)
    return {
      id: "rinf_lc_autofill_already_coded",
      values: { name: link.label, codes: listed },
      severity: "warning",
    };
  if (!isCreation(data.operation) && codes.length === 0)
    return { id: "rinf_lc_autofill_no_code", severity: "warning" };
  return null;
};
