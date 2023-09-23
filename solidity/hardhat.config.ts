import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-abi-exporter"
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY!;
const RPC = process.env.RPC!;

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",
  networks: {
    optest: {
      url: RPC,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      optimisticGoerli: ETHERSCAN_KEY,
    },
  },
  abiExporter: {
    runOnCompile: true,
  },
};

export default config;
