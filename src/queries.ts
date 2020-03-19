import {request} from "graphql-request";

export interface Asset {
  id: string;
  maturity: number;
  notional: BigInt;
  tradeType: string;
}

export interface Transaction {
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
  return result as SwapnetAccount;
}