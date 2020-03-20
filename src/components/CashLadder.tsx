import { SwapnetAccount } from "../queries";
import { formatTradeType, formatBigInt } from "../utils/format";
import { Table } from 'react-materialize';
import React from "react";

const HELPTEXT = "Your cash ladder represents the net amount of cash you will need to pay or receive in future blocks."

export class CashLadder extends React.Component<{account: SwapnetAccount}, {}> {

  render() {
    if (this.props.account === undefined || this.props.account.portfolio.length === 0) {
      return <div></div>
    }
    let sortedPortfolio = this.props.account.portfolio.sort((a, b) => {
        return a.maturity - b.maturity;
    })

    return (
      <div>
        <p>{HELPTEXT}</p>
        <Table className="centered">
          <thead className="teal-text text-lighten-2 center-align">
            <tr>
              <th data-field="maturites"><h5>Maturity</h5></th>
              <th data-field="lend"><h5>Trade Type</h5></th>
              <th data-field="borrow"><h5>Amount</h5></th>
            </tr>
          </thead>
          <tbody>
              {sortedPortfolio.map((a, i) => {
                return (
                  <tr key={i}>
                    <td><h6>Block {a.maturity}</h6></td>
                    <td><h6>{formatTradeType(a.tradeType)}</h6></td>
                    <td><h6>{formatBigInt(a.notional)} Dai</h6></td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </div>
    );
  }
}
