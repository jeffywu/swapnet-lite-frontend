import { SwapnetAccount } from "../queries";
import { BigNumber } from "ethers/utils/bignumber";
import { formatTradeType, formatBigInt, calculateAnnualizedRate } from "../utils/format";
import { Table } from 'react-materialize';
import React from "react";

export class TransactionHistory extends React.Component<{account: SwapnetAccount}, {}> {

  render() {
    if (this.props.account == null || this.props.account.transactions.length == 0) {
      return <div></div>
    }
    let sortedTransactions = this.props.account.transactions.sort((a, b) => {
        return a.maturity - b.maturity;
    })

    return (
      <Table className="centered">
        <thead className="teal-text text-lighten-2 center-align">
          <tr>
            <th data-field="maturity"><h6>Maturity</h6></th>
            <th data-field="tradeType"><h6>Trade Type</h6></th>
            <th data-field="daiAmount"><h6>Dai Amount</h6></th>
            <th data-field="futureCash"><h6>Future Cash</h6></th>
            <th data-field="rate"><h6>Annualized Rate</h6></th>
          </tr>
        </thead>
        <tbody>
            {sortedTransactions.map((t, i) => {
              return (
                <tr key={i}>
                  <td>Block {t.maturity}</td>
                  <td>{formatTradeType(t.tradeType)}</td>
                  <td>{formatBigInt(t.daiAmount)} Dai</td>
                  <td>{formatBigInt(t.futureCash)} Dai</td>
                  <td>{
                    calculateAnnualizedRate(new BigNumber(t.daiAmount.toString()),
                      new BigNumber(t.futureCash.toString()))
                  }</td>
                </tr>
              );
            })}
        </tbody>
      </Table>
    );
  }
}
