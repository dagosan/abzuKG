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

import { Link } from "@mui/material";
import { useIntl } from "react-intl";
import { Link as RouterLink } from "react-router-dom";
import { detailsPath } from "../../detailsKinds";
import { countryName } from "../model/countries";
import { languageName } from "../model/languages";
import type {
  LocationCodeRequest,
  RinfLink,
} from "../model/LocationCodeRequest";
import { findSubsidiaryType } from "../model/subsidiaryTypes";
import { FactList, RequestFileSection } from "./RequestFileSection";

interface RinfLinkTextProps {
  link: RinfLink | null;
}

/** "Gembloux · BEGB", opening the element on the map. */
export const RinfLinkText = ({ link }: RinfLinkTextProps) =>
  link ? (
    <Link component={RouterLink} to={detailsPath(link.kind, link.canonicalId)}>
      {link.label} · {link.canonicalId}
    </Link>
  ) : null;

interface RequestDataSectionProps {
  request: LocationCodeRequest;
}

/** What the requester submitted. */
export const RequestDataSection = ({ request }: RequestDataSectionProps) => {
  const { formatMessage, locale } = useIntl();
  const { data } = request;
  const type = findSubsidiaryType(data.subsidiaryTypeCode);
  const { requester } = data;
  return (
    <RequestFileSection titleId="rinf_lc_section_request">
      <FactList
        facts={[
          [
            "rinf_lc_field_country",
            data.country &&
              `${data.country} · ${countryName(data.country, locale)}`,
          ],
          ["rinf_lc_field_parent", data.parentPrimaryCode],
          ["rinf_lc_field_type", type && `${type.code} · ${type.name}`],
          ["rinf_lc_field_proposed_code", data.proposedCode],
          ["rinf_lc_field_target", data.targetCode],
          ["rinf_lc_field_name", data.locationName],
          ["rinf_lc_field_im", data.imOrganisationCode],
          [
            "rinf_lc_field_rinf",
            data.rinfLink && <RinfLinkText key="link" link={data.rinfLink} />,
          ],
          ["rinf_lc_field_effective_date", data.effectiveDate],
          [
            "rinf_lc_field_close_dependants",
            data.closeDependentCodes
              ? formatMessage({ id: "rinf_lc_yes" })
              : "",
          ],
          [
            "rinf_lc_field_legacy_range",
            data.legacyCodingRange ? formatMessage({ id: "rinf_lc_yes" }) : "",
          ],
          ["rinf_lc_field_justification", data.justification],
          [
            "rinf_lc_field_requester_name",
            `${requester.name} <${requester.email}>`,
          ],
          [
            "rinf_lc_field_organisation",
            `${requester.organisation} (${requester.organisationCode})`,
          ],
          [
            "rinf_lc_field_category",
            requester.category &&
              formatMessage({ id: `rinf_lc_category_${requester.category}` }),
          ],
          ["rinf_lc_field_language", languageName(data.language, locale)],
        ]}
      />
    </RequestFileSection>
  );
};
