export const normalizeEmailAddress = (email: string): string => {
  const trimmed = email.trim();
  const separator = trimmed.lastIndexOf("@");

  if (separator <= 0) {
    return trimmed.toLowerCase();
  }

  let local = trimmed.slice(0, separator).toLowerCase();
  let domain = trimmed.slice(separator + 1).toLowerCase();

  if (domain === "googlemail.com") {
    domain = "gmail.com";
  }

  if (domain === "gmail.com") {
    local = (local.split("+")[0] ?? local).replace(/\./g, "");
  } else if (
    domain === "outlook.com" ||
    domain === "hotmail.com" ||
    domain === "live.com"
  ) {
    local = local.split("+")[0] ?? local;
  }

  return `${local}@${domain}`;
};
