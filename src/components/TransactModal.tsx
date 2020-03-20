import { Modal, Button, Row, Col, TextInput } from 'react-materialize';
import React from "react";
import { SwapnetLite } from '../utils/swapnetLite';
import { formatBalance, formatBigInt, formatMaturity, calculateAnnualizedRate, formatAnnualizedRate, BASIS_POINT } from '../utils/format';
import { ethers } from 'ethers';
import { SwapnetAccount } from '../queries';
import { BigNumber } from 'ethers/utils/bignumber';
import { Maturity } from './MarketTable';

interface TransactModalProps {
  buttonText: string;
  submitAction: () => void;
  leftColumn: JSX.Element;
  centerColumn: JSX.Element;
  rightColumn: JSX.Element;
}

function makeTransactModal(props: TransactModalProps) {
  return (
      <Modal
        actions={[
          <Button flat modal="close" node="button" waves="green">Cancel</Button>,
          <Button modal="close" node="button" waves="green"
            onClick={() => {props.submitAction()}}>
            Submit Transaction
          </Button>
        ]}
        bottomSheet
        fixedFooter={false}
        header={props.buttonText}
        id="modal-0"
        options={{
          dismissible: true,
          endingTop: '10%',
          inDuration: 250,
          onCloseEnd: null,
          onCloseStart: null,
          onOpenEnd: null,
          onOpenStart: null,
          opacity: 0.5,
          outDuration: 250,
          preventScrolling: true,
          startingTop: '4%'
        }}
        trigger={<Button node="button">{props.buttonText}</Button>}
      >
        <Row>
          <Col s={4}>
            {props.leftColumn}
          </Col>
          <Col s={4}>
            {props.centerColumn}
          </Col>
          <Col s={4}>
            {props.rightColumn}
          </Col>
        </Row>
      </Modal>
    );
}

interface BaseTransactProps {
  address: string;
  swapnetLite: SwapnetLite;
  account: SwapnetAccount;
  walletBalance: BigNumber;
}

interface BaseTransactState {
  depositValue: string;
  allowanceValue: string;
  allowance: BigNumber;
}

export class DepositDai extends React.Component<BaseTransactProps, BaseTransactState> {

  constructor(props: BaseTransactProps) {
    super(props);
    this.state = {
      depositValue: '',
      allowanceValue: '',
      allowance: new BigNumber(0)
    };

    this.props.swapnetLite.dai.allowance(
      this.props.address,
      this.props.swapnetLite.futureCash.address
    ).then((allowance) => this.setState({allowance: allowance}))

    this.handleDepositAllowanceChange = this.handleDepositAllowanceChange.bind(this);
    this.handleDepositAmountChange = this.handleDepositAmountChange.bind(this);
    this.setDepositAllowance = this.setDepositAllowance.bind(this);
    this.handleDeposit = this.handleDeposit.bind(this);
  }

  handleDepositAllowanceChange(event: any) {
    this.setState({allowanceValue: event.target.value})
  }

  handleDepositAmountChange(event: any) {
    this.setState({depositValue: event.target.value})
  }

  async setDepositAllowance(value: string) {
    await this.props.swapnetLite.dai.approve(
      this.props.swapnetLite.futureCash.address,
      ethers.utils.parseEther(value)
    );

    let allowance = await this.props.swapnetLite.dai.allowance(
      this.props.address,
      this.props.swapnetLite.futureCash.address
    )
    this.setState({allowance: allowance});
  }

  handleDeposit() {
    let amount = ethers.utils.parseEther(this.state.depositValue);
    this.props.swapnetLite.futureCash.depositDai(amount);
  }

  render() {
    let center: JSX.Element;
    if (this.state.allowance === undefined
      || this.state.allowance.gt(this.props.walletBalance)) {
      center = <span></span>
    } else {
      center = <span>
        <TextInput 
          label="Increase Deposit Allowance"
          onChange={this.handleDepositAllowanceChange}
        /><br/>
        <Button onClick={() => this.setDepositAllowance(this.state.allowanceValue)}>
          Increase Allowance
        </Button>
      </span>
    }

    return makeTransactModal({
      buttonText: "Deposit Dai",
      submitAction: this.handleDeposit,
      leftColumn:
        <span>
          <h6>Total Dai Balance: {formatBalance(this.props.walletBalance)}</h6>
          <h6>Deposited Dai Balance: {formatBigInt(this.props.account.daiBalance)}</h6>
          <h6>Allowance: {formatBalance(this.state.allowance)}</h6>
        </span>,
      centerColumn:
        center,
      rightColumn:
        <span>
          <TextInput
            label="Deposit Dai"
            onChange={this.handleDepositAmountChange}
          />
        </span>
    });
  }
}

export class DepositEth extends React.Component<BaseTransactProps,
  {depositValue: string}> {

  constructor(props: BaseTransactProps) {
    super(props);
    this.state = {
      depositValue: '',
    };

    this.handleDepositAmountChange = this.handleDepositAmountChange.bind(this);
    this.handleDeposit = this.handleDeposit.bind(this);
  }

  handleDepositAmountChange(event: any) {
    this.setState({depositValue: event.target.value})
  }

  handleDeposit() {
    let amount = ethers.utils.parseEther(this.state.depositValue);
    this.props.swapnetLite.futureCash.depositEth({value: amount});
  }

  render() {
    return makeTransactModal({
      buttonText: "Deposit Eth",
      submitAction: this.handleDeposit,
      leftColumn:
        <span>
          <h6>Wallet Eth Balance: {formatBalance(this.props.walletBalance)}</h6>
          <h6>Deposited Eth Balance: {formatBigInt(this.props.account.ethBalance)}</h6>
        </span>,
      centerColumn:
        <span></span>,
      rightColumn:
        <span>
          <TextInput
            label="Deposit Eth"
            onChange={this.handleDepositAmountChange}
          />
        </span>
    });
  }
}

interface LendBorrowState {
  inputAmount: string;
  maxSlippage: BigNumber;
  maxBlock: number;
  projectedRate: BigNumber;
  projectedFutureCash: BigNumber;
  projectedDai: BigNumber;
  fee: BigNumber;
}

interface LendBorrowProps {
  address: string;
  swapnetLite: SwapnetLite;
  account: SwapnetAccount;
  maturity: Maturity;
  currentBlockNumber: number;
  liquidityFee: BigNumber;
}

export class Lend extends React.Component<LendBorrowProps, LendBorrowState> {
  constructor(props: LendBorrowProps) {
    super(props);
    this.state = {
      inputAmount: '',
      maxSlippage: new BigNumber(BASIS_POINT).mul(50),
      maxBlock: this.props.currentBlockNumber + 10,
      projectedRate: new BigNumber(this.props.maturity.marketRate),
      projectedFutureCash: new BigNumber(0),
      projectedDai: new BigNumber(0),
      fee: new BigNumber(0)
    };

    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleBlockChange = this.handleBlockChange.bind(this);
    this.handleSlippageChange = this.handleSlippageChange.bind(this);
    this.handleTransaction = this.handleTransaction.bind(this);
  }

  handleBlockChange(event: any) {
    this.setState({
      maxBlock: event.target.value,
    });
  }

  handleSlippageChange(event: any) {
    try {
      let slippage = new BigNumber(event.target.value);
      this.setState({
        maxSlippage: slippage.mul(BASIS_POINT)
      });
    } catch { }
  }

  handleAmountChange(event: any) {
    try { 
      let amount = ethers.utils.parseEther(event.target.value);
      // See `getFutureCashPrice` on the contracts for this formula
      let fee = amount.mul(this.props.liquidityFee).div(ethers.constants.WeiPerEther);
      let futureCash = this.props.maturity.totalFutureCash.sub(
          (this.props.maturity.totalFutureCash
            .mul(this.props.maturity.totalCollateral))
            .div(this.props.maturity.totalCollateral.sub(fee).add(amount))
        )
      let projectedRate = calculateAnnualizedRate(amount, futureCash);

      this.setState({
        inputAmount: event.target.value,
        projectedDai: amount,
        projectedFutureCash: futureCash,
        projectedRate: projectedRate,
        fee: fee
      });
    } catch {
      this.setState({
        inputAmount: event.target.value,
      });
    }
  }

  handleTransaction() {
    this.props.swapnetLite.futureCash.takeFutureCash(
      this.props.maturity.maturity,
      this.state.projectedDai
    );
  }

  render() {
    return makeTransactModal({
      buttonText: "Lend",
      submitAction: this.handleTransaction,
      leftColumn:
        <span>
          <h6>Max Lending Amount: {formatBigInt(this.props.account.daiBalance)}</h6>
          <h6>Maturity: {formatMaturity(this.props.maturity.maturity)}</h6>
          <h6>Will Receive at Maturity: {formatBalance(this.state.projectedFutureCash)}</h6>
          <h6>Interest Amount: {formatBalance(this.state.projectedFutureCash.sub(this.state.projectedDai))}</h6>
          <h6>Annualized Fixed Rate: {formatAnnualizedRate(this.state.projectedRate)}</h6>
          <h6>Worst Case Fixed Rate: {formatAnnualizedRate(this.state.projectedRate.sub(this.state.maxSlippage))}</h6>
          <h6>Fees: {formatBalance(this.state.fee)}</h6>
        </span>,
      centerColumn:
        <span>
          <TextInput
            defaultValue={this.state.maxSlippage.div(BASIS_POINT).toString()}
            onChange={this.handleAmountChange}>
              <label className="active">Slippage (Basis Points)</label>
              <span className="helper-text">
                The number of basis points (100ths of a percent) of slippage that you are willing
                to tolerate. The transaction will not settle with a worse rate than this.
              </span>
          </TextInput>
          <TextInput
            defaultValue={this.state.maxBlock.toString()}
            onChange={this.handleBlockChange}>
              <label className="active">Max Block</label>
              <span className="helper-text">
                Front running protection: transaction will not settle after this block.
              </span>
            </TextInput>
        </span>,
      rightColumn:
          <TextInput
            label="Lend Dai"
            onChange={this.handleAmountChange}
          />
    });
  }
}

export class Borrow extends React.Component<LendBorrowProps, LendBorrowState> {
  constructor(props: LendBorrowProps) {
    super(props);
    this.state = {
      inputAmount: '',
      maxSlippage: new BigNumber(BASIS_POINT).mul(50),
      maxBlock: this.props.currentBlockNumber + 10,
      projectedRate: new BigNumber(this.props.maturity.marketRate),
      projectedFutureCash: new BigNumber(0),
      projectedDai: new BigNumber(0),
      fee: new BigNumber(0)
    };

    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleBlockChange = this.handleBlockChange.bind(this);
    this.handleSlippageChange = this.handleSlippageChange.bind(this);
    this.handleTransaction = this.handleTransaction.bind(this);
  }

  handleBlockChange(event: any) {
    this.setState({
      maxBlock: event.target.value,
    });
  }

  handleSlippageChange(event: any) {
    try {
      let slippage = new BigNumber(event.target.value);
      this.setState({
        maxSlippage: slippage.mul(BASIS_POINT)
      });
    } catch { }
  }

  handleAmountChange(event: any) {
    try { 
      let amount = ethers.utils.parseEther(event.target.value);

      // The amount we're inputting is the amount of dai to borrow.
      // This is the future cash that we owe.
      let futureCash = this.props.maturity.totalCollateral.mul(
        this.props.maturity.totalFutureCash
      ).div(this.props.maturity.totalCollateral.sub(amount))
       .sub(this.props.maturity.totalFutureCash)
       .div(ethers.constants.WeiPerEther.sub(this.props.liquidityFee))
       .mul(ethers.constants.WeiPerEther);

      let fee = futureCash.mul(this.props.liquidityFee).div(ethers.constants.WeiPerEther);

      let projectedRate = calculateAnnualizedRate(amount, futureCash);

      this.setState({
        inputAmount: event.target.value,
        projectedDai: amount,
        projectedFutureCash: futureCash,
        projectedRate: projectedRate,
        fee: fee
      });
    } catch {
      this.setState({
        inputAmount: event.target.value,
      });
    }
  }

  handleTransaction() {
    this.props.swapnetLite.futureCash.takeDai(
      this.props.maturity.maturity,
      this.state.projectedFutureCash
    );
  }

  render() {
    return makeTransactModal({
      buttonText: "Borrow",
      submitAction: this.handleTransaction,
      leftColumn:
        <span>
          <h6>Max Lending Amount: {formatBigInt(this.props.account.daiBalance)}</h6>
          <h6>Maturity: {formatMaturity(this.props.maturity.maturity)}</h6>
          <h6>Due at Maturity: {formatBalance(this.state.projectedFutureCash)}</h6>
          <h6>Interest Amount: {formatBalance(this.state.projectedFutureCash.sub(this.state.projectedDai))}</h6>
          <h6>Annualized Fixed Rate: {formatAnnualizedRate(this.state.projectedRate)}</h6>
          <h6>Worst Case Fixed Rate: {formatAnnualizedRate(this.state.projectedRate.sub(this.state.maxSlippage))}</h6>
          <h6>Fees: {formatBalance(this.state.fee)}</h6>
        </span>,
      centerColumn:
        <span>
          <TextInput
            defaultValue={this.state.maxSlippage.div(BASIS_POINT).toString()}
            onChange={this.handleAmountChange}>
              <label className="active">Slippage (Basis Points)</label>
              <span className="helper-text">
                The number of basis points (100ths of a percent) of slippage that you are willing
                to tolerate. The transaction will not settle with a worse rate than this.
              </span>
          </TextInput>
          <TextInput
            defaultValue={this.state.maxBlock.toString()}
            onChange={this.handleBlockChange}>
              <label className="active">Max Block</label>
              <span className="helper-text">
                Front running protection: transaction will not settle after this block.
              </span>
            </TextInput>
        </span>,
      rightColumn:
          <TextInput
            label="Borrow Dai"
            onChange={this.handleAmountChange}
          />
    });
  }
}