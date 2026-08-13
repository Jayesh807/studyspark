import { db } from "@/lib/db";

export interface FestivalHolidayItem {
  id: string;
  countryCode: string;
  year: number;
  date: string;
  name: string;
  localName: string;
  type: string;
  source: string;
}

type GoogleCalendarEvent = {
  summary?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
};

const DEFAULT_COUNTRY = "IN";
const GOOGLE_HOLIDAY_CALENDARS: Record<string, string> = {
  IN: "en.indian#holiday@group.v.calendar.google.com",
  US: "en.usa#holiday@group.v.calendar.google.com",
  GB: "en.uk#holiday@group.v.calendar.google.com",
  CA: "en.canadian#holiday@group.v.calendar.google.com",
  AU: "en.australian#holiday@group.v.calendar.google.com",
};

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fromDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

async function fetchGoogleHolidayCalendar(year: number, countryCode: string) {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!apiKey) return [];

  const calendarId =
    process.env[`GOOGLE_HOLIDAY_CALENDAR_${countryCode}`] ||
    GOOGLE_HOLIDAY_CALENDARS[countryCode];
  if (!calendarId) return [];

  const params = new URLSearchParams({
    key: apiKey,
    timeMin: `${year}-01-01T00:00:00Z`,
    timeMax: `${year + 1}-01-01T00:00:00Z`,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?${params.toString()}`,
    { next: { revalidate: 60 * 60 * 24 * 30 } }
  );

  if (!response.ok) return [];

  const data = (await response.json()) as {
    items?: GoogleCalendarEvent[];
  };

  return (data.items ?? [])
    .filter((event) => event.start?.date || event.start?.dateTime)
    .map((holiday) => ({
      countryCode,
      year,
      date: fromDateOnly(
        (holiday.start?.date || holiday.start?.dateTime || "").slice(0, 10)
      ),
      name: holiday.summary || "Holiday",
      localName: holiday.summary || "Holiday",
      type: "Public",
      source: "google",
    }));
}

async function upsertHolidays(
  holidays: Array<{
    countryCode: string;
    year: number;
    date: Date;
    name: string;
    localName: string;
    type: string;
    source: string;
  }>
) {
  if (holidays.length === 0) return;

  await db.$transaction(
    holidays.map((holiday) =>
      db.festivalHoliday.upsert({
        where: {
          countryCode_date_name: {
            countryCode: holiday.countryCode,
            date: holiday.date,
            name: holiday.name,
          },
        },
        update: {
          localName: holiday.localName,
          type: holiday.type,
          source: holiday.source,
        },
        create: holiday,
      })
    )
  );
}

async function seedHolidays(year: number, countryCode: string) {
  try {
    const google = await fetchGoogleHolidayCalendar(year, countryCode);
    await upsertHolidays(dedupeHolidays(google));
  } catch (error) {
    console.warn("[Festivals]: Could not fetch Google holiday calendar", error);
  }
}

function dedupeHolidays(
  holidays: Array<{
    countryCode: string;
    year: number;
    date: Date;
    name: string;
    localName: string;
    type: string;
    source: string;
  }>
) {
  const seen = new Set<string>();
  return holidays.filter((holiday) => {
    const key = `${holiday.date.toISOString().slice(0, 10)}:${holiday.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function ensureGoogleHolidays(year: number, countryCode: string) {
  if (!process.env.GOOGLE_CALENDAR_API_KEY) return;

  const existingGoogle = await db.festivalHoliday.count({
    where: { year, countryCode, source: "google" },
  });
  if (existingGoogle > 0) return;

  try {
    await upsertHolidays(
      dedupeHolidays(await fetchGoogleHolidayCalendar(year, countryCode))
    );
  } catch (error) {
    console.warn("[Festivals]: Could not fetch Google holidays", error);
  }
}

export async function getFestivalHolidays(
  year: number,
  countryCode = DEFAULT_COUNTRY
): Promise<FestivalHolidayItem[]> {
  const safeYear = Math.max(1970, Math.min(2100, Math.round(year)));
  const safeCountry = countryCode.trim().toUpperCase().slice(0, 2) || DEFAULT_COUNTRY;

  let rows = await db.festivalHoliday.findMany({
    where: { year: safeYear, countryCode: safeCountry, source: "google" },
    orderBy: { date: "asc" },
  });

  if (rows.length === 0) {
    await seedHolidays(safeYear, safeCountry);
  } else {
    await ensureGoogleHolidays(safeYear, safeCountry);
  }

  rows = await db.festivalHoliday.findMany({
    where: { year: safeYear, countryCode: safeCountry, source: "google" },
    orderBy: { date: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    countryCode: row.countryCode,
    year: row.year,
    date: toDateOnly(row.date),
    name: row.name,
    localName: row.localName,
    type: row.type,
    source: row.source,
  }));
}
