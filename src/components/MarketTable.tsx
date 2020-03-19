import React from "react";
import { BigNumber } from "ethers/utils";
import { SwapnetAccount } from "../queries";
import { SwapnetLite } from "../utils/swapnetLite";
import { ethers } from "ethers";
import { Table } from 'react-materialize';
import { TransactModal } from './TransactModal';
import { formatRate } from "../utils/format";

interface Maturity {
  marketRate: number;
  maturity: number;
  totalCollateral: BigNumber;
  totalFutureCash: BigNumber;
  totalLiquidity: BigNumber;
}

interface SwapTableState {
  maturities: Maturity[];
}

interface SwapTableProps {
  account: SwapnetAccount;
  swapnetLite: SwapnetLite;
}

export class MarketTable extends React.Component<SwapTableProps, SwapTableState> {

  constructor(props: SwapTableProps) {
    super(props);

    this.handleLending = this.handleLending.bind(this);
    this.handleBorrowing = this.handleBorrowing.bind(this);
    this.updateHelpTextLending = this.updateHelpTextLending.bind(this);
    this.updateHelpTextBorrowing = this.updateHelpTextBorrowing.bind(this);
  }

  handleLending(maturity: number, input: string) {
    let amount = ethers.utils.parseEther(input);
    this.props.swapnetLite.futureCash.takeFutureCash(maturity, amount);
  }

  handleBorrowing(maturity: number, input: string) {
    let amount = ethers.utils.parseEther(input);
    this.props.swapnetLite.futureCash.takeDai(maturity, amount);
  }

  async updateHelpTextLending() {
    return (<span></span>);
  }

  async updateHelpTextBorrowing() {
    return (<span></span>);
  }

  async loadPortfolio() {
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
      maturities: state
    });
  }


  render() {
    if (this.props.swapnetLite == null) {
      return <div></div>;
    } else if (this.props.swapnetLite != null) {
      this.loadPortfolio();
    } 

    if (this.state == null || this.props.account == null) {
      return <div></div>;
    } else {
      return (
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
              <tr>
                <td><h6>Block {m.maturity}</h6></td>
                <td>
                  <TransactModal 
                    buttonText="Lend Dai"
                    submitAction={this.handleLending} 
                    updateHelpText={this.updateHelpTextLending}
                    maturity={m.maturity}
                  />
                </td>
                <td>
                  <h6>{formatRate(m.marketRate)}</h6>
                </td>
                <td>
                  <TransactModal 
                    buttonText="Borrow Dai"
                    submitAction={this.handleBorrowing} 
                    updateHelpText={this.updateHelpTextBorrowing}
                    maturity={m.maturity}
                  />
                </td>
              </tr>)
            })}
          </tbody>
        </Table>
      )
    }
  }
}
