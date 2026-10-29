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

const SATURDAY = 6;
const SUNDAY = 0;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 10;

/**
 * Agency public holidays (YYYY-MM-DD) that are not working days. Empty until
 * the Agency's calendar is entered; until then only weekends are skipped.
 */
export const AGENCY_HOLIDAYS: readonly string[] = [];

/** The date part of an ISO date-time, e.g. "2026-10-29". */
export const isoDateOf = (isoDateTime: string): string =>
  isoDateTime.slice(0, ISO_DATE_LENGTH);

const parseUtcDate = (isoDate: string): Date =>
  new Date(`${isoDateOf(isoDate)}T00:00:00Z`);

const formatUtcDate = (date: Date): string =>
  date.toISOString().slice(0, ISO_DATE_LENGTH);

export const isWorkingDay = (
  isoDate: string,
  holidays: readonly string[] = AGENCY_HOLIDAYS,
): boolean => {
  const weekday = parseUtcDate(isoDate).getUTCDay();
  if (weekday === SATURDAY || weekday === SUNDAY) return false;
  return !holidays.includes(isoDateOf(isoDate));
};

/**
 * Working days after `from` up to and including `to` (dates only): the day a
 * request arrives is day 0, the next working day is day 1.
 */
export const workingDaysBetween = (
  from: string,
  to: string,
  holidays: readonly string[] = AGENCY_HOLIDAYS,
): number => {
  const start = parseUtcDate(from);
  const end = parseUtcDate(to);
  let count = 0;
  for (
    let day = new Date(start.getTime() + MILLISECONDS_PER_DAY);
    day <= end;
    day = new Date(day.getTime() + MILLISECONDS_PER_DAY)
  ) {
    if (isWorkingDay(formatUtcDate(day), holidays)) count++;
  }
  return count;
};

/** The date `workingDays` working days after `from`. */
export const addWorkingDays = (
  from: string,
  workingDays: number,
  holidays: readonly string[] = AGENCY_HOLIDAYS,
): string => {
  let day = parseUtcDate(from);
  let remaining = workingDays;
  while (remaining > 0) {
    day = new Date(day.getTime() + MILLISECONDS_PER_DAY);
    if (isWorkingDay(formatUtcDate(day), holidays)) remaining--;
  }
  return formatUtcDate(day);
};
