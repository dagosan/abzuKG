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

import { MenuItem, TextField } from "@mui/material";
import { useIntl } from "react-intl";
import { languageName, OFFICIAL_EU_LANGUAGES } from "../model/languages";
import { STAKEHOLDER_CATEGORIES } from "../model/stakeholderCategories";
import { FieldRow } from "./FieldRow";
import { FormSection, useFieldError } from "./FormSection";
import type { RequestForm } from "./hooks/useRequestForm";

interface RequesterFieldsProps {
  form: RequestForm;
}

/** Who applies, as which Article 3(9) stakeholder, and in which language. */
export const RequesterFields = ({ form }: RequesterFieldsProps) => {
  const { formatMessage, locale } = useIntl();
  const { data, update, updateRequester, errors } = form;
  const { requester } = data;
  const fieldError = useFieldError(errors);

  return (
    <FormSection
      titleId="rinf_lc_form_requester"
      hintId="rinf_lc_form_requester_hint"
    >
      <FieldRow>
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_field_requester_name" })}
          value={requester.name}
          onChange={(event) => updateRequester({ name: event.target.value })}
          {...fieldError("requesterName")}
        />
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_field_email" })}
          value={requester.email}
          onChange={(event) => updateRequester({ email: event.target.value })}
          {...fieldError("email")}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_field_organisation" })}
          value={requester.organisation}
          onChange={(event) =>
            updateRequester({ organisation: event.target.value })
          }
          {...fieldError("organisation")}
        />
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_field_organisation_code" })}
          value={requester.organisationCode}
          onChange={(event) =>
            updateRequester({
              organisationCode: event.target.value.toUpperCase(),
            })
          }
          {...fieldError(
            "organisationCode",
            "rinf_lc_field_organisation_code_hint",
          )}
        />
      </FieldRow>

      <TextField
        select
        size="small"
        label={formatMessage({ id: "rinf_lc_field_category" })}
        value={requester.category}
        onChange={(event) =>
          updateRequester({
            category: event.target.value as typeof requester.category,
          })
        }
        {...fieldError("category", "rinf_lc_field_category_hint")}
      >
        {STAKEHOLDER_CATEGORIES.map((category) => (
          <MenuItem key={category} value={category}>
            {formatMessage({ id: `rinf_lc_category_${category}` })}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label={formatMessage({ id: "rinf_lc_field_language" })}
        value={data.language}
        onChange={(event) => update({ language: event.target.value })}
        {...fieldError("language")}
      >
        {OFFICIAL_EU_LANGUAGES.map((language) => (
          <MenuItem key={language} value={language}>
            {languageName(language, locale)}
          </MenuItem>
        ))}
      </TextField>
    </FormSection>
  );
};
