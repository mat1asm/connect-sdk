import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { createReadOnlyNftBridgeProgramInterface } from '../program';
import { deriveClaimKey, derivePostedVaaKey } from '../../wormhole';
import {
  deriveEndpointKey,
  deriveNftBridgeConfigKey,
  deriveUpgradeAuthorityKey,
} from '../accounts';
import { BpfLoaderUpgradeable, deriveUpgradeableProgramKey } from '../../utils';
import { VAA, toChainId } from '@wormhole-foundation/connect-sdk';

export function createRegisterChainInstruction(
  connection: Connection,
  nftBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  vaa: VAA<'NftBridgeRegisterChain'>,
): TransactionInstruction {
  const methods = createReadOnlyNftBridgeProgramInterface(
    nftBridgeProgramId,
    connection,
  ).methods.registerChain();

  // @ts-ignore
  return methods._ixFn(...methods._args, {
    accounts: getRegisterChainAccounts(
      nftBridgeProgramId,
      wormholeProgramId,
      payer,
      vaa,
    ) as any,
    signers: undefined,
    remainingAccounts: undefined,
    preInstructions: undefined,
    postInstructions: undefined,
  });
}

export interface RegisterChainAccounts {
  payer: PublicKey;
  config: PublicKey;
  endpoint: PublicKey;
  vaa: PublicKey;
  claim: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
  wormholeProgram: PublicKey;
}

export function getRegisterChainAccounts(
  nftBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  vaa: VAA<'NftBridgeRegisterChain'>,
): RegisterChainAccounts {
  return {
    payer: new PublicKey(payer),
    config: deriveNftBridgeConfigKey(nftBridgeProgramId),
    endpoint: deriveEndpointKey(
      nftBridgeProgramId,
      toChainId(vaa.payload.foreignChain),
      vaa.payload.foreignAddress.toUint8Array(),
    ),
    vaa: derivePostedVaaKey(wormholeProgramId, Buffer.from(vaa.hash)),
    claim: deriveClaimKey(
      nftBridgeProgramId,
      vaa.emitterAddress.toUint8Array(),
      toChainId(vaa.emitterChain),
      vaa.sequence,
    ),
    rent: SYSVAR_RENT_PUBKEY,
    systemProgram: SystemProgram.programId,
    wormholeProgram: new PublicKey(wormholeProgramId),
  };
}

export function createUpgradeContractInstruction(
  connection: Connection,
  nftBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  vaa: VAA<'NftBridgeUpgradeContract'>,
  spill?: PublicKeyInitData,
): TransactionInstruction {
  const methods = createReadOnlyNftBridgeProgramInterface(
    nftBridgeProgramId,
    connection,
  ).methods.upgradeContract();

  // @ts-ignore
  return methods._ixFn(...methods._args, {
    accounts: getUpgradeContractAccounts(
      nftBridgeProgramId,
      wormholeProgramId,
      payer,
      vaa,
      spill,
    ) as any,
    signers: undefined,
    remainingAccounts: undefined,
    preInstructions: undefined,
    postInstructions: undefined,
  });
}

export interface UpgradeContractAccounts {
  payer: PublicKey;
  vaa: PublicKey;
  claim: PublicKey;
  upgradeAuthority: PublicKey;
  spill: PublicKey;
  implementation: PublicKey;
  programData: PublicKey;
  nftBridgeProgram: PublicKey;
  rent: PublicKey;
  clock: PublicKey;
  bpfLoaderUpgradeable: PublicKey;
  systemProgram: PublicKey;
}

export function getUpgradeContractAccounts(
  nftBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  vaa: VAA<'NftBridgeUpgradeContract'>,
  spill?: PublicKeyInitData,
): UpgradeContractAccounts {
  return {
    payer: new PublicKey(payer),
    vaa: derivePostedVaaKey(wormholeProgramId, Buffer.from(vaa.hash)),
    claim: deriveClaimKey(
      nftBridgeProgramId,
      vaa.emitterAddress.toUint8Array(),
      toChainId(vaa.emitterChain),
      vaa.sequence,
    ),
    upgradeAuthority: deriveUpgradeAuthorityKey(nftBridgeProgramId),
    spill: new PublicKey(spill === undefined ? payer : spill),
    implementation: new PublicKey(vaa.payload.newContract.toUint8Array()),
    programData: deriveUpgradeableProgramKey(nftBridgeProgramId),
    nftBridgeProgram: new PublicKey(nftBridgeProgramId),
    rent: SYSVAR_RENT_PUBKEY,
    clock: SYSVAR_CLOCK_PUBKEY,
    bpfLoaderUpgradeable: BpfLoaderUpgradeable.programId,
    systemProgram: SystemProgram.programId,
  };
}
