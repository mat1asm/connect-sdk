import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createReadOnlyNftBridgeProgramInterface } from '../program';
import { getPostMessageAccounts } from '../../wormhole';
import {
  deriveAuthoritySignerKey,
  deriveNftBridgeConfigKey,
  deriveWrappedMintKey,
} from '../accounts';
import {
  deriveSplTokenMetadataKey,
  SplTokenMetadataProgram,
} from '../../utils';
import { deriveWrappedMetaKey } from '../../tokenBridge';

export function createTransferWrappedInstruction(
  connection: Connection,
  nftBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  message: PublicKeyInitData,
  from: PublicKeyInitData,
  fromOwner: PublicKeyInitData,
  tokenChain: number,
  tokenAddress: Buffer | Uint8Array,
  tokenId: bigint | number,
  nonce: number,
  targetAddress: Buffer | Uint8Array,
  targetChain: number,
): TransactionInstruction {
  const methods = createReadOnlyNftBridgeProgramInterface(
    nftBridgeProgramId,
    connection,
  ).methods.transferWrapped(
    nonce,
    Buffer.from(targetAddress) as any,
    targetChain,
  );

  // @ts-ignore
  return methods._ixFn(...methods._args, {
    accounts: getTransferWrappedAccounts(
      nftBridgeProgramId,
      wormholeProgramId,
      payer,
      message,
      from,
      fromOwner,
      tokenChain,
      tokenAddress,
      tokenId,
    ) as any,
    signers: undefined,
    remainingAccounts: undefined,
    preInstructions: undefined,
    postInstructions: undefined,
  });
}

export interface TransferWrappedAccounts {
  payer: PublicKey;
  config: PublicKey;
  from: PublicKey;
  fromOwner: PublicKey;
  mint: PublicKey;
  wrappedMeta: PublicKey;
  splMetadata: PublicKey;
  authoritySigner: PublicKey;
  wormholeBridge: PublicKey;
  wormholeMessage: PublicKey;
  wormholeEmitter: PublicKey;
  wormholeSequence: PublicKey;
  wormholeFeeCollector: PublicKey;
  clock: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  splMetadataProgram: PublicKey;
  wormholeProgram: PublicKey;
}

export function getTransferWrappedAccounts(
  nftBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  message: PublicKeyInitData,
  from: PublicKeyInitData,
  fromOwner: PublicKeyInitData,
  tokenChain: number,
  tokenAddress: Buffer | Uint8Array,
  tokenId: bigint | number,
): TransferWrappedAccounts {
  const mint = deriveWrappedMintKey(
    nftBridgeProgramId,
    tokenChain,
    tokenAddress,
    tokenId,
  );
  const {
    bridge: wormholeBridge,
    message: wormholeMessage,
    emitter: wormholeEmitter,
    sequence: wormholeSequence,
    feeCollector: wormholeFeeCollector,
    clock,
    rent,
    systemProgram,
  } = getPostMessageAccounts(
    wormholeProgramId,
    payer,
    nftBridgeProgramId,
    message,
  );
  return {
    payer: new PublicKey(payer),
    config: deriveNftBridgeConfigKey(nftBridgeProgramId),
    from: new PublicKey(from),
    fromOwner: new PublicKey(fromOwner),
    mint,
    wrappedMeta: deriveWrappedMetaKey(nftBridgeProgramId, mint),
    splMetadata: deriveSplTokenMetadataKey(mint),
    authoritySigner: deriveAuthoritySignerKey(nftBridgeProgramId),
    wormholeBridge,
    wormholeMessage,
    wormholeEmitter,
    wormholeSequence,
    wormholeFeeCollector,
    clock,
    rent,
    systemProgram,
    tokenProgram: TOKEN_PROGRAM_ID,
    splMetadataProgram: SplTokenMetadataProgram.programId,
    wormholeProgram: new PublicKey(wormholeProgramId),
  };
}
