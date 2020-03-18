import {request} from "graphql-request";
import { BigNumber } from "ethers/utils";

export interface Asset {
  id: string;
  maturity: number;
  notional: BigInt;
  tradeType: string;
}

export interface SwapnetAccount {
  id: string;
  daiBalance: BigInt;
  ethBalance: BigInt;
  cashBalance: BigInt;
  portfolio: Asset[];
}

function accountQuery(address: string) { 
  return (`{
    account(id: "${address}") {
      id
      daiBalance
      ethBalance
      cashBalance
      portfolio {
        id
        maturity
        notional
        tradeType
      }
    }
  }`);
}

export async function getAccount(graphUrl: string, address: string) {
  let result = (await request(graphUrl, accountQuery(address.toLowerCase())))['account'];
  return result as SwapnetAccount;
}