interface OpenedInfo {
  firstOpenedAt?: string;
  lastOpenedAt?: string;
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

export function galleryOpenedLabel(record: OpenedInfo): string {
  if (!record.firstOpenedAt) return "Klient galerii zatím neotevřel";
  const first = formatDay(record.firstOpenedAt);
  const last = record.lastOpenedAt ? formatDay(record.lastOpenedAt) : first;
  return last === first
    ? `Otevřeno poprvé ${first}`
    : `Otevřeno poprvé ${first}, naposledy ${last}`;
}
