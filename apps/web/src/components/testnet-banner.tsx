"use client";

import { faucetUrl, isTestnet, networkLabel } from "@/constants/chains";
import { isContractConfigured } from "@/constants/contract";

export function TestnetBanner() {
  if (!isTestnet) return null;

  return (
    <div className="border-b-2 border-[#ffd700] bg-[#1a1a00] px-4 py-2 text-center text-[#ffd700]">
      <p className="font-sans text-xs font-bold tracking-wide">
        TESTNET MODE — {networkLabel}
        {!isContractConfigured && (
          <span className="text-[#ffdb33]">
            {" "}
            · Deploy contract and set NEXT_PUBLIC_LOOT_SCRATCH_ADDRESS
          </span>
        )}
        {faucetUrl && (
          <>
            {" "}
            ·{" "}
            <a
              href={faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              Get faucet CELO
            </a>
          </>
        )}
      </p>
    </div>
  );
}
