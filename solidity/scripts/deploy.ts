import { ethers } from "hardhat";
import hre from "hardhat";
async function main() {
  console.log(`Deploying Token...`);
  const token = await ethers.deployContract("Token");
  const tokenReceipt = await token.deploymentTransaction()?.wait(6);
  const tokenAddress = tokenReceipt?.contractAddress;
  console.log(`Token deployed to ${tokenAddress}`);

  console.log(`Deploying eTransfer...`)
  const args = [tokenAddress];
  const eTransfer = await ethers.deployContract("ETransfer", args);
  const eTransferReceipt = await eTransfer.deploymentTransaction()?.wait(6);
  const eTransferAddress = eTransferReceipt?.contractAddress;
  console.log(`eTransfer deployed to ${eTransferAddress}`);

  console.log(`Verifying...`)
  const vpromise1 = hre.run("verify:verify", {
    address: eTransferAddress,
    constructorArguments: args,
  });
  const vpromise2 = hre.run("verify:verify", {
    address: tokenAddress,
  });
  await Promise.all([vpromise1, vpromise2])
  console.log(`Verification finished!`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
