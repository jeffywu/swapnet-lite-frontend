import {UniswapExchangeInterface} from "../typechain/UniswapExchangeInterface";
import {ERC20} from "../typechain/ERC20";
import {FutureCash} from "../typechain/FutureCash";

import ERC20Artifact from "../abi/ERC20.json";
import FutureCashArtifact from "../abi/FutureCash.json";
import UniswapExchangeArtifact from "../abi/UniswapExchangeInterface.json";
import { Signer, Contract } from "ethers";

export class SwapnetLite {
  constructor(
    public uniswap: UniswapExchangeInterface,
    public dai: ERC20,
    public futureCash: FutureCash
  ) {}

  public static build(uniswapAddress: string, daiAddress: string, futureCashAddress: string, signer: Signer) {
    let uniswap = new Contract(uniswapAddress, UniswapExchangeArtifact.abi, signer) as UniswapExchangeInterface;
    let dai = new Contract(daiAddress, ERC20Artifact.abi, signer) as ERC20;
    let futureCash = new Contract(futureCashAddress, FutureCashArtifact.abi, signer) as FutureCash;

    return new SwapnetLite(uniswap, dai, futureCash);
  }

}