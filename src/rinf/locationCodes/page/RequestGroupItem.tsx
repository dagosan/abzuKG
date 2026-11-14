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

import type { RequestGroup } from "../bulk/bulkRequests";
import { BulkListItem } from "./BulkListItem";
import { RequestListItem } from "./RequestListItem";

interface RequestGroupItemProps {
  group: RequestGroup;
  /** Id of the request or bulk request that is open, if any. */
  selectedId: string | null;
  onOpen: (requestId: string) => void;
  onOpenBulk: (bulkId: string) => void;
}

/** One item of a request list: a request, or a bulk request with its lines as one. */
export const RequestGroupItem = ({
  group,
  selectedId,
  onOpen,
  onOpenBulk,
}: RequestGroupItemProps) =>
  group.kind === "bulk" ? (
    <BulkListItem
      bulkId={group.bulkId}
      lines={group.lines}
      selected={
        group.bulkId === selectedId ||
        group.lines.some((line) => line.id === selectedId)
      }
      onOpen={onOpenBulk}
    />
  ) : (
    <RequestListItem
      request={group.request}
      selected={group.request.id === selectedId}
      onOpen={onOpen}
    />
  );

/** A stable key for a group in a list. */
export const groupKey = (group: RequestGroup): string =>
  group.kind === "bulk" ? group.bulkId : group.request.id;
