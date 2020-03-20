import React from 'react';
import { SwapnetAccount } from "../queries";
import { SwapnetLite } from "../utils/swapnetLite";
import { BigNumber } from "ethers/utils";
import { formatBalance, formatBigInt } from "../utils/format";
import { DepositDai, DepositEth } from "./TransactModal";
import { Row, Col,  Button } from 'react-materialize';

interface BalancesProps {
  address: string;
  account: SwapnetAccount;
  swapnetLite: SwapnetLite;
  freeCollateral: BigNumber;
  daiWalletBalance: BigNumber;
  ethWalletBalance: BigNumber;
}

export class Balances extends React.Component<BalancesProps, {}> {

  constructor(props: BalancesProps) {
    super(props);
    this.handleSettleCash = this.handleSettleCash.bind(this);
  }

  handleSettleCash() {
    console.log("Settle Cash");
  }

  render() {
    if (this.props.swapnetLite === undefined || this.props.account === undefined) {
      return <div></div>
    }

    let dai = formatBigInt(this.props.account.daiBalance);
    let eth = formatBigInt(this.props.account.ethBalance);
    let cash = formatBigInt(this.props.account.cashBalance);
    let freeCollateral = formatBalance(this.props.freeCollateral);

    return (
      <div className="container" style={{ border: "solid", borderWidth: "thin", borderColor: "#00bfa5" }}>
        <Row>
          <h4>Deposits</h4>
          <p>Deposit and withdraw collateral balances in order to trade.</p>
          <Col s={4}>
            <h4>Dai: {dai}</h4>
            <DepositDai 
              walletBalance={this.props.daiWalletBalance}
              address={this.props.address}
              swapnetLite={this.props.swapnetLite}
              account={this.props.account}
            />
          </Col>
          <Col s={4}>
            <h4>Eth: {eth}</h4>
            <DepositEth 
              walletBalance={this.props.ethWalletBalance}
              address={this.props.address}
              swapnetLite={this.props.swapnetLite}
              account={this.props.account}
            />
          </Col>
          <Col s={4}>
            <h4>Cash: {cash}</h4>
            <Button node="button" waves="light" onClick={this.handleSettleCash}>
              Settle Cash
            </Button>
          </Col>
        </Row>
        <Row>
          <h6>Free Collateral: {freeCollateral} Dai</h6>
        </Row>
      </div>
    )
  }
}