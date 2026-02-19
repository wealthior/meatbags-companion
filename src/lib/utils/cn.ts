import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
