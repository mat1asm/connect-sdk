import { expect, test } from "@jest/globals";
import {
  chains,
  chainConfigs,
  DEFAULT_NETWORK,
  chainToPlatform,
} from "@wormhole-foundation/connect-sdk";
import { CosmwasmPlatform } from "../../src/platform";

const network = "Testnet"; // DEFAULT_NETWORK;
const configs = chainConfigs(network);

// const COSMWASM_CHAINS = chains.filter(
//   (c) => chainToPlatform(c) === CosmwasmPlatform.platform
// );
const COSMWASM_CHAINS = chains.filter((c) => c === "Cosmoshub");

describe("Cosmwasm Platform Tests", () => {
  describe("Get Chain", () => {
    test("No conf", () => {
      // no issues just grabbing the chain
      const p = CosmwasmPlatform.setConfig(network, {});
      expect(p.conf).toEqual({});
      const c = p.getChain(COSMWASM_CHAINS[0]);
      expect(c).toBeTruthy();
    });

    test("With conf", () => {
      const p = CosmwasmPlatform.setConfig(network, {
        [COSMWASM_CHAINS[0]]: configs[COSMWASM_CHAINS[0]],
      });
      expect(() => p.getChain(COSMWASM_CHAINS[0])).not.toThrow();
    });
  });

  describe("Get RPC Connection", () => {
    test("No conf", async () => {
      const p = CosmwasmPlatform.setConfig(network, {});
      expect(p.conf).toEqual({});

      // expect getRpc to throw an error since we havent provided
      // the conf to figure out how to connect
      expect(async () => await p.getRpc(COSMWASM_CHAINS[0])).rejects.toThrow();
      expect(
        async () => await p.getChain(COSMWASM_CHAINS[0]).getRpc()
      ).rejects.toThrow();
    });

    test("With conf", async () => {
      const p = CosmwasmPlatform.setConfig(network, {
        [COSMWASM_CHAINS[0]]: configs[COSMWASM_CHAINS[0]],
      });
      expect(async () => await p.getRpc(COSMWASM_CHAINS[0])).not.toThrow();
      expect(
        async () => await p.getChain(COSMWASM_CHAINS[0]).getRpc()
      ).not.toThrow();
    });
  });
});
