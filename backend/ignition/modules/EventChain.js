const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");

/**
 * @notice List of supported token addresses for EventChain transactions.
 * @dev These are predefined token addresses on the blockchain that can be used for ticket purchases.
 *      Make sure these addresses are correct and available on the target network.
 */

const _supportedTokens = [
  ethers.getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"), // USDC
  ethers.getAddress("0x4200000000000000000000000000000000000006"), // WETH
];

/**
 * @notice Deployment module for the EventChain smart contract.
 * @dev Uses Hardhat Ignition to deploy the EventChain contract with predefined supported tokens.
 * @param {object} m - The module deployment object provided by Hardhat Ignition.
 * @return {object} An object containing the deployed EventChain contract instance.
 */
module.exports = buildModule("EventChainModule", (m) => {
  const eventChain = m.contract("EventChain", [_supportedTokens]);
  return { eventChain };
});
