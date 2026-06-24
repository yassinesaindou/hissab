// lib/utils/ean13.ts
// Real, scanner-compatible EAN-13 barcode encoder.
// Encodes a 13-digit code into the precise bar pattern defined by the
// EAN-13 specification (start guard, 6 left digits, center guard,
// 6 right digits, end guard — 95 modules total).

const L_CODE: Record<string, string> = {
  "0": "0001101", "1": "0011001", "2": "0010011", "3": "0111101", "4": "0100011",
  "5": "0110001", "6": "0101111", "7": "0111011", "8": "0110111", "9": "0001011",
};

const G_CODE: Record<string, string> = {
  "0": "0100111", "1": "0110011", "2": "0011011", "3": "0100001", "4": "0011101",
  "5": "0111001", "6": "0000101", "7": "0010001", "8": "0001001", "9": "0010111",
};

const R_CODE: Record<string, string> = {
  "0": "1110010", "1": "1100110", "2": "1101100", "3": "1000010", "4": "1011100",
  "5": "1001110", "6": "1010000", "7": "1000100", "8": "1001000", "9": "1110100",
};

const PARITY_TABLE: Record<string, string> = {
  "0": "LLLLLL", "1": "LLGLGG", "2": "LLGGLG", "3": "LLGGGL", "4": "LGLLGG",
  "5": "LGGLLG", "6": "LGGGLL", "7": "LGLGLG", "8": "LGLGGL", "9": "LGGLGL",
};

/** Validates an EAN-13 string (13 digits) and its checksum. */
export function isValidEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const checksum = digits.pop()!;
  const sum = digits.reduce(
    (acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3),
    0
  );
  const expected = (10 - (sum % 10)) % 10;
  return expected === checksum;
}

/**
 * Encodes a 13-digit EAN-13 code into its 95-module bit string.
 * Each character is "1" (black bar) or "0" (white space), one unit wide.
 * Throws if the code isn't exactly 13 digits.
 */
export function encodeEAN13(code: string): string {
  if (!/^\d{13}$/.test(code)) {
    throw new Error("EAN-13 code must be exactly 13 digits.");
  }

  const firstDigit = code[0];
  const leftDigits = code.slice(1, 7);
  const rightDigits = code.slice(7, 13);
  const parityPattern = PARITY_TABLE[firstDigit];

  let bits = "101"; // start guard

  for (let i = 0; i < 6; i++) {
    const digit = leftDigits[i];
    const useG = parityPattern[i] === "G";
    bits += useG ? G_CODE[digit] : L_CODE[digit];
  }

  bits += "01010"; // center guard

  for (let i = 0; i < 6; i++) {
    bits += R_CODE[rightDigits[i]];
  }

  bits += "101"; // end guard

  return bits; // 95 characters
}

/**
 * Converts the 95-bit pattern into an array of {isBar, width} runs,
 * useful for rendering as <rect> elements or styled <div>s without
 * needing one element per single bit (more efficient, same visual result).
 */
export function bitsToBars(bits: string): { isBar: boolean; width: number }[] {
  const bars: { isBar: boolean; width: number }[] = [];
  let current = bits[0];
  let count = 0;

  for (const bit of bits) {
    if (bit === current) {
      count++;
    } else {
      bars.push({ isBar: current === "1", width: count });
      current = bit;
      count = 1;
    }
  }
  bars.push({ isBar: current === "1", width: count });

  return bars;
}