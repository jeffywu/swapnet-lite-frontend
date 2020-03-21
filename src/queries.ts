import {request} from "graphql-request";
import { AddressZero } from "ethers/constants";

interface Asset {
  id: string;
  maturity: number;
  notional: BigInt;
  tradeType: string;
}

interface Transaction {
  id: string;
  tradeType: string;
  maturity: number;
  futureCash: BigInt;
  daiAmount: BigInt;
}

export interface SwapnetAccount {
  id: string;
  daiBalance: BigInt;
  ethBalance: BigInt;
  cashBalance: BigInt;
  portfolio: Asset[];
  transactions: Transaction[];
}

export let EmptyAccount = {
  id: AddressZero,
  daiBalance: BigInt(0),
  ethBalance: BigInt(0),
  cashBalance: BigInt(0),
  portfolio: [],
  transactions: []
} as SwapnetAccount;

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
      transactions {
        id
        tradeType
        maturity
        futureCash
        daiAmount
      }
    }
  }`);
}

export async function getAccount(graphUrl: string, address: string) {
  let result = (await request(graphUrl, accountQuery(address.toLowerCase())))['account'];
  if (result == null) {
    return EmptyAccount;
  } else {
    return result as SwapnetAccount;
  }
}