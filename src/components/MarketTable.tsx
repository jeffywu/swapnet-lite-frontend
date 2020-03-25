import React from "react";
import { BigNumber } from "ethers/utils";
import { SwapnetAccount } from "../queries";
import { SwapnetLite } from "../utils/swapnetLite";
import { Table } from 'react-materialize';
import { formatRate } from "../utils/format";
import { Lend, Borrow } from "./TransactModal";

const HELPTEXT = "Lend and Borrow Dai at fixed rates for these maturities.";

export interface Maturity {
  marketRate: number;
  maturity: number;
  totalCollateral: BigNumber;
  totalFutureCash: BigNumber;
  totalLiquidity: BigNumber;
}

interface MarketTableState {
  maturities: Maturity[];
  liquidityFee: BigNumber;
}

interface MarketTableProps {
  account: SwapnetAccount;
  swapnetLite: SwapnetLite;
  currentBlockNumber: number;
  freeCollateral: BigNumber;
}

export class MarketTable extends React.Component<MarketTableProps, MarketTableState> {

  async loadPortfolio() {
    let liquidityFee = await this.props.swapnetLite.futureCash.G_LIQUIDITY_FEE();
    let maturities = await this.props.swapnetLite.futureCash.getActiveMaturities();
    let state = await Promise.all(maturities.map(async (m, i) => {
      let market = await this.props.swapnetLite.futureCash.markets(m);
      let rate = (await this.props.swapnetLite.futureCash.getRate(m))[0];

      return {
        marketRate: rate,
        maturity: m,
        totalCollateral: market.totalCollateral,
        totalFutureCash: market.totalFutureCash,
        totalLiquidity: market.totalLiquidity,
      } as Maturity
    }));

    this.setState({
      maturities: state,
      liquidityFee: liquidityFee
    });
  }

  render() {
    if (this.props.swapnetLite === undefined) {
      return <div></div>;
    } else {
      this.loadPortfolio();
    } 

    if (this.state == null || this.props.account == null) {
      return <div></div>;
    } else {
      return (
        <div>
          <p>{HELPTEXT}</p>
          <Table className="centered">
            <thead className="teal-text text-lighten-2 center-align">
              <tr>
                <th data-field="maturites"><h5>Maturities</h5></th>
                <th data-field="lend"><h5>Lend</h5></th>
                <th data-field="rate"><h5>Market Rate</h5></th>
                <th data-field="borrow"><h5>Borrow</h5></th>
              </tr>
            </thead>
            <tbody>
              {this.state.maturities.map((m, i) => {
                return (
                <tr key={i}>
                  <td><h6>Block {m.maturity}</h6></td>
                  <td>
                    <Lend 
                      address={this.props.account.id}
                      swapnetLite={this.props.swapnetLite}
                      account={this.props.account}
                      maturity={m}
                      currentBlockNumber={this.props.currentBlockNumber}
                      liquidityFee={this.state.liquidityFee}
                      freeCollateral={this.props.freeCollateral}
                    />
                  </td>
                  <td>
                    <h6>{formatRate(m.marketRate)}</h6>
                  </td>
                  <td>
                    <Borrow 
                      address={this.props.account.id}
                      swapnetLite={this.props.swapnetLite}
                      account={this.props.account}
                      maturity={m}
                      currentBlockNumber={this.props.currentBlockNumber}
                      liquidityFee={this.state.liquidityFee}
                      freeCollateral={this.props.freeCollateral}
                    />
                  </td>
                </tr>)
              })}
            </tbody>
          </Table>
      </div>)
    }
  }
}
