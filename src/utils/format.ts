import { BigNumber } from "ethers/utils";
import { ethers } from "ethers";

export const RATE_PRECISION = 1_000_000_000;
export const BASIS_POINT = RATE_PRECISION / 100;
export const BALANCE_PRECISION = 1_000_000_000_000_000;
const AVERAGE_BLOCK_TIME_MS = parseInt(process.env.REACT_APP_AVERAGE_BLOCK_TIME_MS as string);
const GENESIS_BLOCK_TIME_MS = parseInt(process.env.REACT_APP_GENESIS_BLOCK_TIME_MS as string);
const MS_IN_YEAR = 31536000000

export function formatBlock(maturity: number): string {
  let blockTime = new Date(maturity * AVERAGE_BLOCK_TIME_MS + GENESIS_BLOCK_TIME_MS);
  return `${blockTime.toLocaleDateString()} (Block ${maturity})`;
}

export function calculateAnnualizedRate(dai: BigNumber, futureCash: BigNumber, periodSize: number): BigNumber {
  if (periodSize == 0) return new BigNumber(0);

  const multiplier = MS_IN_YEAR / (periodSize * AVERAGE_BLOCK_TIME_MS);

  return futureCash
          .sub(dai)
          .mul(RATE_PRECISION)
          .div(dai)
          .mul(multiplier * RATE_PRECISION)
          .div(RATE_PRECISION)
          .add(RATE_PRECISION)
}

export function annualizeRate(rate: number, periodSize: number): number {
  if (periodSize == 0) return 0;

  const multiplier = MS_IN_YEAR / (periodSize * AVERAGE_BLOCK_TIME_MS);
  return ((rate - 1) * multiplier + 1);
}

export function formatAnnualizedRate(rate: BigNumber): string {
  return ((rate.toNumber()) / RATE_PRECISION)
          .toPrecision(4)
          .toString() + "%";
}

export function formatBigInt(num: BigInt): string {
  return formatBalance(new BigNumber(num.toString()));
}

export function formatRate(num: number): string {
  return ((num + RATE_PRECISION) / RATE_PRECISION).toPrecision(4) + "%";
}

export function formatMaturity(num: number): string {
  return "Block " + num.toString()
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