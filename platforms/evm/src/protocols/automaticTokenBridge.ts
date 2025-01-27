import {
  ChainAddress,
  UniversalOrNative,
  AutomaticTokenBridge,
  VAA,
  serialize,
  TokenId,
  chainToChainId,
  toChainId,
  Network,
} from '@wormhole-foundation/connect-sdk';

import { Provider, TransactionRequest } from 'ethers';

import { evmNetworkChainToEvmChainId } from '../constants';
import {
  EvmChainName,
  UniversalOrEvm,
  addChainId,
  addFrom,
  toEvmAddrString,
} from '../types';
import { EvmUnsignedTransaction } from '../unsignedTransaction';
import { TokenBridgeRelayer } from '../ethers-contracts';
import { EvmContracts } from '../contracts';
import { EvmPlatform } from '../platform';

export class EvmAutomaticTokenBridge implements AutomaticTokenBridge<'Evm'> {
  readonly tokenBridgeRelayer: TokenBridgeRelayer;
  readonly chainId: bigint;

  // https://github.com/wormhole-foundation/wormhole-connect/blob/development/sdk/src/contexts/eth/context.ts#L379

  private constructor(
    readonly network: Network,
    readonly chain: EvmChainName,
    readonly provider: Provider,
    readonly contracts: EvmContracts,
  ) {
    if (network === 'Devnet')
      throw new Error('AutomaticTokenBridge not supported on Devnet');

    this.chainId = evmNetworkChainToEvmChainId(network, chain);
    this.tokenBridgeRelayer = this.contracts.getTokenBridgeRelayer(
      chain,
      provider,
    );
  }
  async *redeem(
    sender: UniversalOrNative<'Evm'>,
    vaa: VAA<'TransferWithPayload'>,
  ): AsyncGenerator<EvmUnsignedTransaction> {
    const senderAddr = toEvmAddrString(sender);
    const txReq =
      await this.tokenBridgeRelayer.completeTransferWithRelay.populateTransaction(
        serialize(vaa),
      );

    return this.createUnsignedTx(
      addFrom(txReq, senderAddr),
      'TokenBridgeRelayer.completeTransferWithRelay',
    );
  }

  static async fromProvider(
    provider: Provider,
    contracts: EvmContracts,
  ): Promise<EvmAutomaticTokenBridge> {
    const [network, chain] = await EvmPlatform.chainFromRpc(provider);
    return new EvmAutomaticTokenBridge(network, chain, provider, contracts);
  }

  //alternative naming: initiateTransfer
  async *transfer(
    sender: UniversalOrEvm,
    recipient: ChainAddress,
    token: UniversalOrEvm | 'native',
    amount: bigint,
    relayerFee: bigint,
    nativeGas?: bigint,
  ): AsyncGenerator<EvmUnsignedTransaction> {
    const senderAddr = toEvmAddrString(sender);
    const recipientChainId = chainToChainId(recipient.chain);
    const recipientAddress = recipient.address
      .toUniversalAddress()
      .toUint8Array();
    const nativeTokenGas = nativeGas ? nativeGas : 0n;

    if (token === 'native') {
      const txReq =
        await this.tokenBridgeRelayer.wrapAndTransferEthWithRelay.populateTransaction(
          nativeTokenGas,
          recipientChainId,
          recipientAddress,
          0, // skip batching
          { value: relayerFee + amount + nativeTokenGas },
        );
      yield this.createUnsignedTx(
        addFrom(txReq, senderAddr),
        'TokenBridgeRelayer.wrapAndTransferETHWithRelay',
      );
    } else {
      //TODO check for ERC-2612 (permit) support on token?
      const tokenAddr = toEvmAddrString(token);
      // TODO: allowance?

      const txReq =
        await this.tokenBridgeRelayer.transferTokensWithRelay.populateTransaction(
          tokenAddr,
          amount,
          nativeTokenGas,
          recipientChainId,
          recipientAddress,
          0,
        );

      yield this.createUnsignedTx(
        addFrom(txReq, senderAddr),
        'TokenBridgeRelayer.transferTokensWithRelay',
      );
    }
  }

  async getRelayerFee(
    sender: ChainAddress,
    recipient: ChainAddress,
    token: TokenId | 'native',
  ): Promise<bigint> {
    const tokenId: TokenId =
      token === 'native'
        ? await this.contracts.getNativeWrapped(sender.chain, this.provider)
        : token;

    const destChainId = toChainId(recipient.chain);
    const destTokenAddress = toEvmAddrString(tokenId.address.toString());

    const tokenContract = EvmContracts.getTokenImplementation(
      this.provider,
      destTokenAddress,
    );
    const decimals = await tokenContract.decimals();

    return await this.tokenBridgeRelayer.calculateRelayerFee(
      destChainId,
      destTokenAddress,
      decimals,
    );
  }

  private createUnsignedTx(
    txReq: TransactionRequest,
    description: string,
    parallelizable: boolean = false,
  ): EvmUnsignedTransaction {
    return new EvmUnsignedTransaction(
      addChainId(txReq, this.chainId),
      this.network,
      this.chain,
      description,
      parallelizable,
    );
  }
}
