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

import { useIntl } from "react-intl";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import { RinfLinkText } from "./RequestDataSection";
import { FactList, RequestFileSection } from "./RequestFileSection";

interface StepRecordsSectionProps {
  request: LocationCodeRequest;
}

/** Steps 4 to 8 and 14 as recorded: who settled what, and when (section 13). */
export const StepRecordsSection = ({ request }: StepRecordsSectionProps) => {
  const { formatMessage, formatDate } = useIntl();
  const { recommendation, rinfPosition, coordination, decision, review } =
    request;
  const when = (isoDateTime: string | null) =>
    isoDateTime
      ? formatDate(isoDateTime, { dateStyle: "medium", timeStyle: "short" })
      : "";
  const byWhom = (actor: Actor, at: string) =>
    formatMessage(
      { id: "rinf_lc_by_on" },
      { name: actor.name, date: when(at) },
    );
  const groundText = (ground: string | null) =>
    ground ? formatMessage({ id: `rinf_lc_ground_${ground}` }) : "";
  if (!request.registeredAt && !decision) return null;

  return (
    <RequestFileSection titleId="rinf_lc_section_records">
      <FactList
        facts={[
          ["rinf_lc_record_registered", when(request.registeredAt)],
          [
            "rinf_lc_record_recommendation",
            recommendation &&
              `${formatMessage({ id: `rinf_lc_decision_${recommendation.outcome}` })} ${groundText(recommendation.ground)}`,
          ],
          [
            "rinf_lc_record_rinf_position",
            rinfPosition && (
              <span key="position">
                {formatMessage({
                  id: `rinf_lc_position_${rinfPosition.outcome}`,
                })}{" "}
                {rinfPosition.link && <RinfLinkText link={rinfPosition.link} />}
                {" — "}
                {byWhom(rinfPosition.by, rinfPosition.at)}
              </span>
            ),
          ],
          [
            "rinf_lc_record_coordination",
            coordination &&
              `${formatMessage({ id: `rinf_lc_coordination_${coordination.outcome}` })} (${coordination.organisation}) — ${byWhom(coordination.by, coordination.at)}`,
          ],
          [
            "rinf_lc_record_decision",
            decision &&
              `${formatMessage({ id: `rinf_lc_decision_${decision.outcome}` })}${decision.code ? ` ${decision.code}` : ""} — ${byWhom(decision.by, decision.at)}`,
          ],
          ["rinf_lc_record_ground", decision && groundText(decision.ground)],
          ["rinf_lc_record_provision", decision?.provision],
          ["rinf_lc_record_published", when(request.publishedAt)],
          ["rinf_lc_record_notified", when(request.notifiedAt)],
          [
            "rinf_lc_record_review",
            review &&
              `${formatMessage({ id: `rinf_lc_review_${review.outcome ?? "pending"}` })} — ${review.reasons}`,
          ],
        ]}
      />
    </RequestFileSection>
  );
};
