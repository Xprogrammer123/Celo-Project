/** Short, human-readable copy for wallet / tx failures. */
export function friendlyWalletError(
  err: unknown,
  context: "payment" | "mint" = "payment"
): string | null {
  if (!err) return null;

  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "object" &&
          err !== null &&
          "shortMessage" in err &&
          typeof (err as { shortMessage?: string }).shortMessage === "string"
        ? (err as { shortMessage: string }).shortMessage
        : String(err);

  const lower = msg.toLowerCase();

  if (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("rejected the request") ||
    lower.includes("denied transaction") ||
    lower.includes("action_rejected") ||
    lower.includes("4001")
  ) {
    return context === "mint"
      ? "Mint cancelled — no charge made."
      : "Payment cancelled — no charge made.";
  }

  if (lower.includes("not enough celo") || lower.includes("insufficient funds")) {
    return "Not enough CELO for this pack.";
  }

  if (lower.includes("connect wallet")) {
    return "Connect your wallet first.";
  }

  if (lower.includes("switch to")) {
    const match = msg.match(/Switch to .+/i);
    return match ? match[0] : "Switch to the correct network in your wallet.";
  }

  if (lower.includes("no celo balance")) {
    return "Your wallet has no CELO — grab some from the faucet.";
  }

  if (msg.length > 100 || lower.includes("request arguments")) {
    return "Could not complete payment. Try again.";
  }

  return msg.trim() || "Could not complete payment. Try again.";
}
