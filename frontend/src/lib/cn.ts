import { twMerge } from "tailwind-merge";

type ClassValue = string | false | null | undefined;

/**
 * Merge conditional class names and resolve conflicting Tailwind utilities.
 * Kept dependency-free (tailwind-merge is already installed) so primitives
 * can compose without pulling in clsx.
 */
export const cn = (...inputs: ClassValue[]): string =>
  twMerge(inputs.filter(Boolean).join(" "));
