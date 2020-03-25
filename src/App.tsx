import React from 'react';
import './App.css';
import Github from './github.png';
import { Signer, ethers } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { Row, Col, Button, Tab, Tabs} from 'react-materialize';
import { BigNumber, Network } from 'ethers/utils';
import { SwapnetLite } from './utils/swapnetLite';
import { getAccount, SwapnetAccount } from './queries';
import {MarketTable} from './components/MarketTable';
import {Balances} from './components/Balances';
import {formatBalance } from './utils/format';
import { CashLadder } from './components/CashLadder';
import { TransactionHistory } from './components/TransactionHistory';

const NETWORK_NAME = process.env.REACT_APP_NETWORK;
const GRAPH_URL = process.env.REACT_APP_GRAPH_URL as string;
const UNISWAP_ADDRESS = process.env.REACT_APP_UNISWAP_ADDRESS as string;
const DAI_ADDRESS = process.env.REACT_APP_DAI_ADDRESS as string;
const FUTURE_CASH_ADDRESS = process.env.REACT_APP_FUTURE_CASH_ADDRESS as string;

interface AppProp { }

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
  ethTokenPrice: BigNumber;
}

export default class App extends React.Component<AppProp, AppState> {
  state = {} as AppState

  constructor(props: AppProp) {
    super(props);
    this.handleFaucet = this.handleFaucet.bind(this);
  }

  handleFaucet() {
    this.state.swapnetLite.dai.mint();
  }

  async loadBlockchain() {
    // Modern DApp Browsers
    let web3: Web3Provider;
    if ((window as any).ethereum) {
      web3 = new Web3Provider((window as any).ethereum);
      try { 
          await (window as any).ethereum.enable();
          let signer = web3.getSigner() as Signer;
          let swapnetLite = this.state.swapnetLite;
          if (swapnetLite == null || signer !== this.state.signer) {
            // Only reset this if something has changed.
            swapnetLite = SwapnetLite.build(UNISWAP_ADDRESS, DAI_ADDRESS, FUTURE_CASH_ADDRESS, web3.getSigner());
          }
          let address = await signer.getAddress();

          await Promise.all([
            web3.getBalance(address),
            swapnetLite.dai.balanceOf(address),
            web3.getBlockNumber(),
            getAccount(GRAPH_URL, address),
            swapnetLite.futureCash.freeCollateral(address),
            web3.getNetwork(),
            swapnetLite.uniswap.getEthToTokenInputPrice(ethers.constants.WeiPerEther)
          ]).then((values) => {
            this.setState({
              address: address,
              signer: signer,
              provider: web3,
              swapnetLite: swapnetLite,
              ethWalletBalance: values[0],
              daiWalletBalance: values[1],
              currentBlockNumber: values[2],
              account: values[3],
              freeCollateral: values[4],
              network: values[5],
              ethTokenPrice: values[6]
            });
          })

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
    this.loadBlockchain();
    this.setState({
      timer: setInterval(() => this.loadBlockchain(), 2000)
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
              DAI/ETH: {formatBalance(this.state.ethTokenPrice)}
            </p>
          </Col>
          <Col s={6}>
            <h1>Swapnet Lite</h1>
          </Col>
          <Col s={3}>
            <Button node="button" style={{ margin: '10px' }} waves="light" onClick={this.handleFaucet}>
              Mint Test Dai
            </Button><br/>
            <a href="https://github.com/swapnet-protocol/swapnet-lite" target="_blank" rel="noopener noreferrer">
              <img style={{ margin: '10px' }} src={Github} alt="Github Link" />
            </a>
          </Col>
        </Row>
        <Balances 
          address={this.state.address}
          account={this.state.account}
          swapnetLite={this.state.swapnetLite}
          freeCollateral={this.state.freeCollateral}
          daiWalletBalance={this.state.daiWalletBalance}
          ethWalletBalance={this.state.ethWalletBalance}
          />
        <Row className="container">
        </Row>
        <Row className="container" style={{ marginTop: '2.5em'}}>
          <Tabs className="deep-purple lighten-1">
            <Tab title="Lend/Borrow">
              <MarketTable 
                account={this.state.account}
                swapnetLite={this.state.swapnetLite}
                currentBlockNumber={this.state.currentBlockNumber}
                freeCollateral={this.state.freeCollateral}
              />
            </Tab>
            <Tab title="Cash Ladder">
              <CashLadder account={this.state.account} />
            </Tab>
            <Tab title="Transaction History">
              <TransactionHistory account={this.state.account} />
            </Tab>
          </Tabs>
        </Row>
      </div>
    );
  }
}