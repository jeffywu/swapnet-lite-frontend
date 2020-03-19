import { SwapnetAccount } from "../queries";
import { SwapnetLite } from "../utils/swapnetLite";
import { BigNumber } from "ethers/utils";
import { formatBalance, formatBigInt } from "../utils/format";
import { ethers } from "ethers";
import { TransactModal } from "./TransactModal";
import React from 'react';
import { Row, Col,  Button } from 'react-materialize';

interface BalancesProps {
  address: string;
  account: SwapnetAccount;
  swapnetLite: SwapnetLite;
  freeCollateral: BigNumber;
}

export class Balances extends React.Component<BalancesProps, {}> {

  constructor(props: BalancesProps) {
    super(props);

    this.updateHelpTextDai = this.updateHelpTextDai.bind(this);
    this.updateHelpTextEth = this.updateHelpTextEth.bind(this);

    this.handleDepositDai = this.handleDepositDai.bind(this);
    this.handleDepositEth = this.handleDepositEth.bind(this);
    this.handleSettleCash = this.handleSettleCash.bind(this);
  }

  async updateHelpTextDai() {
    let balance = await this.props.swapnetLite.dai.balanceOf(this.props.address);
    let allowance = await this.props.swapnetLite.dai.allowance(
      this.props.address,
      this.props.swapnetLite.futureCash.address
    )

    if (allowance.eq(0)) {
      await this.props.swapnetLite.dai.approve(
        this.props.swapnetLite.futureCash.address,
        balance
      );

      // Get the new allowance
      allowance = await this.props.swapnetLite.dai.allowance(
        this.props.address,
        this.props.swapnetLite.futureCash.address
      )
    }

    return (
      <span>
        <h6>Max Deposit: {formatBalance(balance)}</h6>
        <h6>Allowance: {formatBalance(allowance)}</h6>
        <p>Deposit Dai into Swapnet Lite in order to lend or provide liquidity.</p>
      </span>
    )
  }

  async updateHelpTextEth() { }

  handleDepositDai(maturity: number, input: string) {
    let amount = ethers.utils.parseEther(input);
    this.props.swapnetLite.futureCash.depositDai(amount);
  }

  handleDepositEth(maturity: number, input: string) {
    let amount = ethers.utils.parseEther(input);
    this.props.swapnetLite.futureCash.depositEth({value: amount});
  }

  handleSettleCash() {
    console.log("Settle Cash");
  }

  render() {
    let dai;
    let eth;
    let cash;
    let freeCollateral;

    if (this.props.account) {
      dai = formatBigInt(this.props.account.daiBalance);
      eth = formatBigInt(this.props.account.ethBalance);
      cash = formatBigInt(this.props.account.cashBalance);
      freeCollateral = formatBalance(this.props.freeCollateral);
    } else {
      dai = "0.0";
      eth = "0.0";
      cash = "0.0";
      freeCollateral = "0.0";
    }

    return (
      <div className="container" style={{ border: "solid", borderWidth: "thin", borderColor: "#00bfa5" }}>
        <Row>
          <h4>Deposits</h4>
          <Col s={4}>
            <h4>Dai: {dai}</h4>
            <TransactModal 
              buttonText="Deposit Dai"
              submitAction={this.handleDepositDai} 
              updateHelpText={this.updateHelpTextDai}
              maturity={null}
            />
          </Col>
          <Col s={4}>
            <h4>Eth: {eth}</h4>
            <TransactModal 
              buttonText="Deposit Eth"
              submitAction={this.handleDepositEth} 
              updateHelpText={this.updateHelpTextEth}
              maturity={null}
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