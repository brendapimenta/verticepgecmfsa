/**
 * Checks if a password has been exposed in known data breaches
 * using the Have I Been Pwned (HIBP) API with k-anonymity.
 * 
 * Returns the number of times the password was found in breaches.
 * Returns 0 if the password is safe.
 */
export async function checkPasswordLeaked(password: string): Promise<number> {
  // SHA-1 hash the password
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

  const prefix = hashHex.substring(0, 5);
  const suffix = hashHex.substring(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });

    if (!response.ok) {
      // If HIBP is down, don't block the user — fail open
      console.warn(`HIBP API returned status ${response.status}`);
      return 0;
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }

    return 0;
  } catch (error) {
    console.warn("HIBP check failed (network error), allowing password:", error);
    return 0;
  }
}

export const HIBP_ERROR_MSG = "Esta senha foi encontrada em bases de dados de senhas vazadas na internet. Por segurança, escolha uma senha diferente e mais segura.";
