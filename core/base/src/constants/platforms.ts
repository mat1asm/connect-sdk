import { ChainName } from "./chains";
import { Network } from "./networks";
import { RoArray, ToMapping, column, constMap } from "../utils";

const platformAndChainsEntries = [
  [
    "Evm",
    [
      "Ethereum",
      "Bsc",
      "Polygon",
      "Avalanche",
      "Oasis",
      "Aurora",
      "Fantom",
      "Karura",
      "Acala",
      "Klaytn",
      "Celo",
      "Moonbeam",
      "Neon",
      "Arbitrum",
      "Optimism",
      "Gnosis",
      "Base",
      "Sepolia",
    ],
  ],
  ["Solana", ["Solana", "Pythnet"]],
  ["Cosmwasm", ["Terra", "Terra2", "Injective", "Xpla", "Sei"]],
  ["Btc", ["Btc"]],
  //TODO don't know if any of the following chains actually share a platform with any other chain
  ["Algorand", ["Algorand"]],
  ["Sui", ["Sui"]],
  ["Aptos", ["Aptos"]],
  ["Osmosis", ["Osmosis"]],
  ["Wormchain", ["Wormchain"]],
  ["Near", ["Near"]],
] as const satisfies RoArray<readonly [string, RoArray<ChainName>]>;

export const platforms = column(platformAndChainsEntries, 0);
export type PlatformName = (typeof platforms)[number];

export const platformToChains = constMap(platformAndChainsEntries);
export const chainToPlatform = constMap(platformAndChainsEntries, [1, 0]);

export type PlatformToChains<P extends PlatformName> =
  ReturnType<typeof platformToChains<P>>[number];
export type ChainToPlatform<C extends ChainName> =
  ReturnType<typeof chainToPlatform<C>>;

const networkChainEvmCIdEntries = [
  ["Mainnet", [
    ["Ethereum", 1n],
    ["Bsc", 56n],
    ["Polygon", 137n],
    ["Avalanche", 43114n],
    ["Oasis", 42262n],
    ["Aurora", 1313161554n],
    ["Fantom", 250n],
    ["Karura", 686n],
    ["Acala", 787n],
    ["Klaytn", 8217n],
    ["Celo", 42220n],
    ["Moonbeam", 1284n],
    ["Neon", 245022934n],
    ["Arbitrum", 42161n],
    ["Optimism", 10n],
    ["Gnosis", 100n],
    ["Base", 8453n],
  ]],
  ["Testnet", [
    ["Ethereum", 5n], //goerli
    ["Sepolia", 11155111n], //actually just another ethereum testnet...
    ["Bsc", 97n],
    ["Polygon", 80001n], //mumbai
    ["Avalanche", 43113n], //fuji
    ["Oasis", 42261n],
    ["Aurora", 1313161555n],
    ["Fantom", 4002n],
    ["Karura", 596n],
    ["Acala", 597n],
    ["Klaytn", 1001n], //baobab
    ["Celo", 44787n], //alfajores
    ["Moonbeam", 1287n], //moonbase alpha
    ["Arbitrum", 421613n], //arbitrum goerli
    ["Optimism", 420n],
    ["Gnosis", 77n],
    ["Base", 84531n],
  ]],
] as const satisfies
  RoArray<readonly [Network, RoArray<readonly [PlatformToChains<"Evm">, bigint]>]>;

export const evmChainIdToNetworkChainPair = constMap(networkChainEvmCIdEntries, [2,[0,1]]);
export const evmNetworkChainToEvmChainId = constMap(networkChainEvmCIdEntries);

//TODO more platform specific functions, e.g.:
//  Solana genesis block <-> (Chain, Network)
//  similar mappings for other platforms

// Solana genesis blocks:
//   devnet: EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG (i.e. testnet for us)
//   testnet: 4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY << not used!
//   mainnet-beta: 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
