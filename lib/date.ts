const DISPLAY_TIME_ZONE = "Asia/Shanghai";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function parseDate(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDateZh(value?: string | Date | null) {
  const date = parseDate(value);
  if (!date) {
    return typeof value === "string" && value ? value : "--";
  }

  return DATE_FORMATTER.format(date);
}

export function formatDateTimeZh(value?: string | Date | null) {
  const date = parseDate(value);
  if (!date) {
    return typeof value === "string" && value ? value : "--";
  }

  return DATE_TIME_FORMATTER.format(date);
}
