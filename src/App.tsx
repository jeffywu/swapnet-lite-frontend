import React from 'react';
import './App.css';
import Github from './github.png';
import { Signer, ethers } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { Row, Col, Table, Button, Modal, TextInput } from 'react-materialize';
import { BigNumber, Network, formatEther } from 'ethers/utils';
import { SwapnetLite } from './swapnetLite';
import { getAccount, SwapnetAccount, Asset } from './queries';

const NETWORK_NAME = process.env.REACT_APP_NETWORK;
const GRAPH_URL = process.env.REACT_APP_GRAPH_URL as string;
const UNISWAP_ADDRESS = process.env.REACT_APP_UNISWAP_ADDRESS as string;
const DAI_ADDRESS = process.env.REACT_APP_DAI_ADDRESS as string;
const FUTURE_CASH_ADDRESS = process.env.REACT_APP_FUTURE_CASH_ADDRESS as string;
const RATE_PRECISION = 1_000_000_000;
const BALANCE_PRECISION = 1_000_000_000_000_000;

function formatBigInt(num: BigInt): string {
  return formatBalance(new BigNumber(num.toString()));
}

function formatRate(num: number): string {
  return ((num + RATE_PRECISION) / RATE_PRECISION).toPrecision(4) + "%";
}

function formatBalance(balance: BigNumber): string {
  if(balance === undefined) {
    return "";
  }
  return ethers.utils.commify(ethers.utils.formatEther(balance.div(BALANCE_PRECISION).mul(BALANCE_PRECISION)));
}

function formatAsset(asset: Asset): string {
  if (asset === undefined) {
    return "No Position";
  }

  let amount = formatBigInt(asset.notional);
  switch(asset.tradeType) {
    case "CASH_PAYER":
      return "-" + amount + " Dai";
    case "CASH_RECEIVER":
      return "+" + amount + " Dai";
    case "LIQUIDITY_TOKEN":
      return amount + " Dai Liquidity";
    default:
      return "No Position";
  }
}

interface SwapTableProps {
  account: SwapnetAccount;
  swapnetLite: SwapnetLite;
}

interface BalancesProps {
  address: string;
  account: SwapnetAccount;
  swapnetLite: SwapnetLite;
  freeCollateral: BigNumber;
}

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

class SwapTable extends React.Component<SwapTableProps, SwapTableState> {

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
              let asset = this.props.account.portfolio.filter((asset) => {
                if (asset.maturity == m.maturity && asset.tradeType != "LIQUIDITY_TOKEN") {
                  return true;
                } else {
                  return false;
                }
              })[0];
              // <th data-field="position">Position</th>
                // <td>{formatAsset(asset)}</td>

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

interface TransactModalProps {
  buttonText: string;
  submitAction: any;
  updateHelpText: any;
  maturity: number | null;
}

class TransactModal extends React.Component<TransactModalProps, {value: string, helpText: JSX.Element}> {
  constructor(props: TransactModalProps) {
    super(props);
    this.state = {
      value: '',
      helpText: <span></span>
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updateHelpText = this.updateHelpText.bind(this);
  }

  handleInputChange(event: any) {
    this.setState({ value: event.target.value });
  }

  updateHelpText() {
    this.props.updateHelpText().then((helpText: JSX.Element) => {
      this.setState({ helpText: helpText });
    })
  }

  render() {
    return (
      <Modal
        actions={[
          <Button flat modal="close" node="button" waves="green">Cancel</Button>,
          <Button modal="close" node="button" waves="green"
            onClick={() => {this.props.submitAction(this.props.maturity, this.state.value)}}>
            Submit Transaction
          </Button>
        ]}
        bottomSheet
        fixedFooter={false}
        header={this.props.buttonText}
        id="modal-0"
        options={{
          dismissible: true,
          endingTop: '10%',
          inDuration: 250,
          onCloseEnd: null,
          onCloseStart: null,
          onOpenEnd: null,
          onOpenStart: this.updateHelpText,
          opacity: 0.5,
          outDuration: 250,
          preventScrolling: true,
          startingTop: '4%'
        }}
        trigger={<Button node="button">{this.props.buttonText}</Button>}
      >
        <Row className="container">
          <Col s={3}></Col>
          <Col s={6}>
            {this.state.helpText}
            <TextInput 
              label={this.props.buttonText}
              value={this.state.value}
              onChange={this.handleInputChange}
            />
          </Col>
          <Col s={3}></Col>
        </Row>
      </Modal>
    );
  }
}


class Balances extends React.Component<BalancesProps, {}> {

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

interface AppProp {
}

interface AppState {
  signer: Signer;
  provider: Web3Provider;
  address: string;
  network: Network;
  timer: NodeJS.Timeout;
  ethWalletBalance: BigNumber;
  daiWalletBalance: BigNumber;
  freeCollateral: BigNumber;
  currentBlockNumber: number;
  swapnetLite: SwapnetLite;
  account: SwapnetAccount;
}

export default class App extends React.Component<AppProp, AppState> {
  state = {} as AppState;

  constructor(props: AppProp) {
    super(props);

    this.handleFaucet = this.handleFaucet.bind(this);
  }

  handleFaucet() {
    this.state.swapnetLite.dai.mint();
  }

  async loadBlockChain() {
    // Modern DApp Browsers
    let web3: Web3Provider;
    if ((window as any).ethereum) {
      web3 = new Web3Provider((window as any).ethereum);
      try { 
          await (window as any).ethereum.enable();
          let address = await web3.getSigner().getAddress();
          let signer = web3.getSigner() as Signer;
          let swapnetLite = SwapnetLite.build(UNISWAP_ADDRESS, DAI_ADDRESS, FUTURE_CASH_ADDRESS, web3.getSigner());
          let ethWalletBalance = await web3.getBalance(address);
          let daiWalletBalance = await swapnetLite.dai.balanceOf(address);
          let currentBlockNumber = await web3.getBlockNumber();
          let account = await getAccount(GRAPH_URL, address);
          let freeCollateral = await swapnetLite.futureCash.freeCollateral(address);

          this.setState({
            address: address,
            signer: signer,
            network: await web3.getNetwork(),
            provider: web3,
            ethWalletBalance: ethWalletBalance,
            daiWalletBalance: daiWalletBalance,
            freeCollateral: freeCollateral,
            swapnetLite: swapnetLite,
            account: account,
            currentBlockNumber: currentBlockNumber
          });

          if (this.state.network.name !== NETWORK_NAME) {
            alert(`Please switch MetaMask to ${NETWORK_NAME}, currently on ${this.state.network.name}!`);
          }
      } catch(e) {
          // User has denied account access to DApp...
      }
    } else if ((window as any).web3) {
      // Legacy DApp Browsers
        web3 = new Web3Provider((window as any).web3.currentProvider);
    } else {
      // Non-DApp Browser
      alert('You have to install MetaMask !');
    }

  }

  componentDidMount() {
    this.loadBlockChain();
    this.setState({
      timer: setInterval(() => this.loadBlockChain(), 1000)
    });
  }

  componentWillUnmount() {
    clearInterval(this.state.timer);
  }

  render() {
    return (
      <div className="App deep-purple white-text">
        <Row>
          <Col s={3} >
            <p className="left-align">
              {this.state.address}<br/>
              Dai: {formatBalance(this.state.daiWalletBalance)}<br/>
              Eth: {formatBalance(this.state.ethWalletBalance)}<br/>
              Block: {this.state.currentBlockNumber}<br/>
            </p>
          </Col>
          <Col s={6}>
            <h1>Swapnet Lite</h1>
          </Col>
          <Col s={3}>
            <Button node="button" style={{ margin: '10px' }} waves="light" onClick={this.handleFaucet}>
              Mint Test Dai
            </Button><br/>
            <a href="https://www.github.com" target="_blank" rel="noopener noreferrer">
              <img style={{ margin: '10px' }} src={Github} alt="Github Link" />
            </a>
          </Col>
        </Row>
        <Balances 
          address={this.state.address}
          account={this.state.account}
          swapnetLite={this.state.swapnetLite}
          freeCollateral={this.state.freeCollateral}
          />
        <Row className="container">
          <SwapTable account={this.state.account} swapnetLite={this.state.swapnetLite}/>
        </Row>
      </div>
    );
  }
}
