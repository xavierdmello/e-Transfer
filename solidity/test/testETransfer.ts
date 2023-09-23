import { expect, assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";

function hashEmail(email: string): `0x${string}` {
  return keccak256(encodeAbiParameters(parseAbiParameters("string"), [email]));
}

const MAX_INT = BigInt(2) ** BigInt(256) - BigInt(1);

describe("ETransfer", function () {
  async function deployFixture() {
    const mail1 = "dmello_xavier7@hotmail.com";
    const mail2 = "xaviermdmello@gmail.com";
    const hmail1 = hashEmail(mail1);
    const hmail2 = hashEmail(mail2);
    const [account1, account2, account3] = await ethers.getSigners();

    // Deploy
    let token = await ethers.deployContract("Token");
    await token.waitForDeployment();
    let etransfer = await ethers.deployContract("ETransfer", [await token.getAddress()]);
    await etransfer.waitForDeployment();

    // Link Accounts
    await etransfer.linkAccount(hmail1, account1.address);
    await etransfer.linkAccount(hmail2, account2.address);

    // Mint some
    await token.mint(account1.address, 100);
    await token.mint(account2.address, 100);

    // Approve
    await token.connect(account1).approve(await etransfer.getAddress(), MAX_INT);
    await token.connect(account2).approve(await etransfer.getAddress(), MAX_INT);

    return { etransfer, mail1, mail2, hmail1, hmail2, token, account1, account2, account3 };
  }

  it("Linking accounts", async function () {
    const { etransfer, mail1, hmail1, account1 } = await loadFixture(deployFixture);

    expect(await etransfer.linkedEmail(account1.address)).to.equal(hmail1);
  });

  it("onlyLinker protection", async function () {
    const { etransfer, mail1, hmail1, account1, account2 } = await loadFixture(deployFixture);

    // Sanity check
    await expect(etransfer.linkAccount("0x7465737400000000000000000000000000000000000000000000000000000000", ethers.ZeroAddress)).not.to.be.reverted;

    const etransferbad = etransfer.connect(account2);

    await expect(etransferbad.linkAccount("0x7465737400000000000000000000000000000000000000000000000000000000", ethers.ZeroAddress)).to.be.revertedWith(
      "Only linker can call this function."
    );
  });

  it("Sending tokens", async function () {
    let { etransfer, account2, account1, hmail2, token, hmail1 } = await loadFixture(deployFixture);

    // Send
    const sendAmount = 10;
    let tx = etransfer.sendTransfer(hmail2, sendAmount);
    await expect(tx).to.changeTokenBalances(token, [account1.address, await etransfer.getAddress()], [sendAmount * -1, sendAmount]);
    await expect(tx).to.emit(etransfer, "TransferPending").withArgs(hmail1, hmail2, sendAmount);
    expect((await etransfer.getPendingTransfers())[0]).to.deep.equal([hmail1, hmail2, account1.address, sendAmount]);

    // Receive
    etransfer = etransfer.connect(account2);
    tx = etransfer.receiveTransfer(0, account2.address);
    await expect(tx).to.changeTokenBalances(token, [await etransfer.getAddress(), account2.address], [sendAmount * -1, sendAmount]);
    await expect(tx).to.emit(etransfer, "TransferSent").withArgs(hmail1, hmail2, sendAmount, false);
    expect(await etransfer.getPendingTransfers()).to.be.empty;
  });

  it("Sending tokens with autodeposit", async function () {
    let { etransfer, account2, account1, hmail2, token, hmail1, account3 } = await loadFixture(deployFixture);

    // Test setting up autodeposit
    etransfer = etransfer.connect(account3);
    await expect(etransfer.setAutodepositAddress(account3.address)).to.be.revertedWith("You must have an etransfer account to change autodeposit settings.");

    etransfer = etransfer.connect(account2);
    await expect(etransfer.setAutodepositAddress(account2.address)).not.to.be.reverted;

    expect(await etransfer.autodepositAddress(hmail2)).to.equal(account2.address);

    // Send
    etransfer = etransfer.connect(account1);
    const sendAmount = 10;
    let tx = etransfer.sendTransfer(hmail2, sendAmount);
    await expect(tx).to.changeTokenBalances(token, [account1.address, account2.address], [sendAmount * -1, sendAmount]);
    await expect(tx).to.emit(etransfer, "TransferSent").withArgs(hmail1, hmail2, sendAmount, true);
    expect(await etransfer.getPendingTransfers()).to.be.empty;
  });

  it("Cancelling a transfer from the sender", async function () {
    let { etransfer, account2, account1, hmail2, token, hmail1 } = await loadFixture(deployFixture);

    // Send
    const sendAmount = 10;
    let tx = etransfer.sendTransfer(hmail2, sendAmount);
    await expect(tx).to.changeTokenBalances(token, [account1.address, await etransfer.getAddress()], [sendAmount * -1, sendAmount]);
    await expect(tx).to.emit(etransfer, "TransferPending").withArgs(hmail1, hmail2, sendAmount);
    expect((await etransfer.getPendingTransfers())[0]).to.deep.equal([hmail1, hmail2, account1.address, sendAmount]);

    // Cancel
    tx = etransfer.cancelTransfer(0);
    const refundAddress = (await etransfer.getPendingTransfers())[0][2];
    await expect(tx).to.emit(etransfer, "TransferCancelled").withArgs(hmail1, hmail2, sendAmount, 0);
    await expect(tx).to.changeTokenBalances(token, [await etransfer.getAddress(), refundAddress], [sendAmount * -1, sendAmount]);
  });

  it("Cancelling a transfer from the receiver", async function () {
    let { etransfer, account2, account1, hmail2, token, hmail1 } = await loadFixture(deployFixture);

    // Send
    const sendAmount = 10;
    let tx = etransfer.sendTransfer(hmail2, sendAmount);
    await expect(tx).to.changeTokenBalances(token, [account1.address, await etransfer.getAddress()], [sendAmount * -1, sendAmount]);
    await expect(tx).to.emit(etransfer, "TransferPending").withArgs(hmail1, hmail2, sendAmount);
    expect((await etransfer.getPendingTransfers())[0]).to.deep.equal([hmail1, hmail2, account1.address, sendAmount]);

    // Cancel
    etransfer = etransfer.connect(account2);
    tx = etransfer.cancelTransfer(0);
    const refundAddress = (await etransfer.getPendingTransfers())[0][2];
    await expect(tx).to.emit(etransfer, "TransferCancelled").withArgs(hmail1, hmail2, sendAmount, 1);
    await expect(tx).to.changeTokenBalances(token, [await etransfer.getAddress(), refundAddress], [sendAmount * -1, sendAmount]);
  });

  it("Prevent malicious cancellation of a transfer from a third party", async function () {
    let { etransfer, account2, account1, hmail2, token, hmail1, account3 } = await loadFixture(deployFixture);

    // Send
    const sendAmount = 10;
    let tx = etransfer.sendTransfer(hmail2, sendAmount);
    await expect(tx).to.changeTokenBalances(token, [account1.address, await etransfer.getAddress()], [sendAmount * -1, sendAmount]);
    await expect(tx).to.emit(etransfer, "TransferPending").withArgs(hmail1, hmail2, sendAmount);
    expect((await etransfer.getPendingTransfers())[0]).to.deep.equal([hmail1, hmail2, account1.address, sendAmount]);

    // Cancel
    etransfer = etransfer.connect(account3);
    await expect(etransfer.cancelTransfer(0)).to.be.reverted;
  });
});
