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

/** One of the codes RINF holds for the element, with its location name. */
export interface CodeChoice {
  code: string;
  name: string;
}

/** Fields the user can fill by choosing one of the element's codes. */
export type CodeChoiceField =
  "parentPrimaryCode" | "targetCode" | "proposedCode";

/** A message under the RINF element: text key and its values. */
export interface RinfNotice {
  id: string;
  values?: Record<string, string>;
  severity: "info" | "warning";
  /** Several codes and the form needs one: the user picks it here. */
  choices?: CodeChoice[];
  choiceField?: CodeChoiceField;
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
  const changes: Partial<RequestData> =
    data.codeType === "primary"
      ? primaryChanges(data, {
          name,
          country,
          imCode: single?.imCode ?? null,
          code,
        })
      : subsidiaryChanges(data, link, code);
  const filled = (Object.keys(changes) as string[]).filter(
    (key) => key !== "rinfLink",
  ) as RequestField[];
  const choices = codes.map((each) => ({
    code: each,
    name: element.codeNames[each] ?? "",
  }));
  const notice =
    declarations.length > 1
      ? {
          id: "rinf_lc_autofill_several_ims",
          values: { declarations: declarationList(element) },
          severity: "warning" as const,
          ...choicesFor(data, choices),
        }
      : noticeFor(data, link, choices);
  return { changes, filled, notice };
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

/** The field one of the element's codes goes into, if the form needs one. */
const choiceFieldOf = (data: RequestData): CodeChoiceField | null => {
  if (data.codeType === "subsidiary") return "parentPrimaryCode";
  if (!isCreation(data.operation)) return "targetCode";
  return data.operation === "existingCode" ? "proposedCode" : null;
};

/** With several codes, the user picks the one the form needs. */
const choicesFor = (
  data: RequestData,
  choices: CodeChoice[],
): Pick<RinfNotice, "choices" | "choiceField"> => {
  const choiceField = choiceFieldOf(data);
  return choiceField && choices.length > 1 ? { choices, choiceField } : {};
};

const listOf = (choices: CodeChoice[]): string =>
  choices
    .map(({ code, name }) => (name ? `${code} (${name})` : code))
    .join(", ");

/**
 * What to tell the user about the codes RINF already holds. An element may
 * hold any number of locations, each with its own PLC: existing codes are
 * information, never a reason not to ask for another.
 */
const noticeFor = (
  data: RequestData,
  link: RinfLink,
  choices: CodeChoice[],
): RinfNotice | null => {
  const choiceField = choiceFieldOf(data);
  if (choices.length === 0) {
    if (data.codeType === "subsidiary")
      return { id: "rinf_lc_autofill_no_parent", severity: "warning" };
    return choiceField
      ? { id: "rinf_lc_autofill_no_code", severity: "warning" }
      : null;
  }
  const values = { name: link.label, codes: listOf(choices) };
  if (choices.length > 1 && choiceField)
    return {
      id: "rinf_lc_autofill_choose_code",
      values,
      severity: "info",
      ...choicesFor(data, choices),
    };
  if (data.operation === "newCode" && data.codeType === "primary")
    return { id: "rinf_lc_autofill_existing_codes", values, severity: "info" };
  return null;
};
