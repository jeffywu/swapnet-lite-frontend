import { BigNumber } from "ethers/utils";
import { ethers } from "ethers";
import { Asset } from "../queries";

const RATE_PRECISION = 1_000_000_000;
const BALANCE_PRECISION = 1_000_000_000_000_000;

export function formatBigInt(num: BigInt): string {
  return formatBalance(new BigNumber(num.toString()));
}

export function formatRate(num: number): string {
  return ((num + RATE_PRECISION) / RATE_PRECISION).toPrecision(4) + "%";
}

export function formatBalance(balance: BigNumber): string {
  if(balance === undefined) {
    return "";
  }
  return ethers.utils.commify(ethers.utils.formatEther(balance.div(BALANCE_PRECISION).mul(BALANCE_PRECISION)));
}

export function formatTradeType(tradeType: string) {
  switch(tradeType) {
    case "CASH_PAYER":
      return "Pay";
    case "CASH_RECEIVER":
      return "Receive";
    case "LIQUIDITY_TOKEN":
      return "Liquidity";
    default:
      return "No Position";
  }
}

function formatAsset(asset: Asset): string {
  if (asset === undefined) {
    return "No Position";
  }

  let amount = formatBigInt(asset.notional);
  switch(asset.tradeType) {
    case "CASH_PAYER":
      return "-" + amount + " Dai";
    case "CASH_RECEIVER":
      return "+" + amount + " Dai";
    case "LIQUIDITY_TOKEN":
      return amount + " Dai Liquidity";
    default:
      return "No Position";
  }
}