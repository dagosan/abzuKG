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

/**
 * Annex B of the procedure: the grounds for rejection. Text keys:
 * rinf_lc_ground_<id>. Each ground carries the provision relied upon, which
 * a rejection must state (procedure 8.7).
 */
export type RejectionGround =
  | "inadmissible"
  | "notTelematicsStakeholder"
  | "duplicate"
  | "noParentCode"
  | "notOnNetwork"
  | "outsideScope"
  | "uniquenessNotSecured"
  | "dataQuality"
  | "dependentCodesActive";

export const REJECTION_GROUNDS: RejectionGround[] = [
  "inadmissible",
  "notTelematicsStakeholder",
  "duplicate",
  "noParentCode",
  "notOnNetwork",
  "outsideScope",
  "uniquenessNotSecured",
  "dataQuality",
  "dependentCodesActive",
];

export const GROUND_PROVISIONS: Record<RejectionGround, string> = {
  inadmissible: "Procedure 7 and 8.3; Art. 74 Reg. (EU) 2016/796",
  notTelematicsStakeholder: "Art. 3(9) and 9(4) TEL TSI",
  duplicate: "Procedure 6.2(c) and 8.5; TD 103 4.3",
  noParentCode: "Procedure 6.2(a); TD 103 4.6.1",
  notOnNetwork: "Procedure 8.6; Art. 9(6) TEL TSI",
  outsideScope: "Art. 9(5) TEL TSI",
  uniquenessNotSecured: "Procedure 10.3",
  dataQuality: "Annex point 1.5 TEL TSI",
  dependentCodesActive: "Procedure 6.2(a) and 9",
};
