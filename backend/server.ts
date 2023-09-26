import { ethers, parseEther } from "ethers";
import eTransferAbi from "./eTransferAbi";
import "dotenv/config";
import * as postmark from "postmark";
import { ref, set, onValue, onChildAdded, onChildChanged } from "firebase/database";
import db from "./firebase";

import tokenAbi from "./tokenAbi";

const RPC = process.env.RPC!;
const POSTMARK_KEY = process.env.POSTMARK_KEY!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const eTransferAddress = "0xB2D2f29e572577854306099DFA24B07596eC92a7";
const tokenAddress = "0x62e6940856c42bD23C0c895824921678A37A62aE";
// TODO: Implement NonceManager from ethers
let client = new postmark.ServerClient(POSTMARK_KEY);

// Order of events:
// 1. On startup: server goes through all account in the database, makes sure they're linked, and if not, links them.
// 2. Server goes into listening mode, and sends emails/links accounts as needed.
async function main() {
  const provider = new ethers.WebSocketProvider(RPC);
  const contract = new ethers.Contract(eTransferAddress, eTransferAbi, provider);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("e-Transfer server started.");

  const newAccountRef = ref(db, "users/");
  let initialDataLoaded = false;
  onValue(newAccountRef, () => {
    initialDataLoaded = true;
  });
  onChildAdded(newAccountRef, (snapshot) => {
    if (initialDataLoaded == true) {
      const emailHash = snapshot.key;
      const accountData = snapshot.val();
      const account = accountData.address;

      if (account && emailHash) {
        linkAccounts(emailHash, account);
      }
    } else {
      // These tasks are for when the server starts up. If any account was not linked (i.e server was down), it will be linked now. Improves redundancy.
      console.log("Checking if account is linked (startup task) (1/2)");
      async function runChecks() {
        if (snapshot.key && snapshot.val()) {
          const emailHash = snapshot.key;
          const accountData = snapshot.val();
          const account = accountData.address;

          if (account && emailHash) {
            try {
              const isLinked: boolean = await isAccountLinked(account);

              if (isLinked === false) {
                console.log(`Account ${accountData.email} is not linked. Linking now. (2/2)`);
                await linkAccounts(emailHash, account);
              } else {
                console.log(`Account ${accountData.email} is linked. All good. (2/2)`);
              }
            } catch (err) {
              console.error(err);
              console.log("Error fetching isLinked. Potential RPC rate limit. Just gonna pretend this didn't happen :P");
            }
          } else {
            console.log("User has not completed onboarding yet. All good. (2/2).");
          }
        }
      }
      runChecks();
    }
  });
  onChildChanged(newAccountRef, (snapshot) => {
    const emailHash = snapshot.key;
    const accountData = snapshot.val();
    const account = accountData.address;

    if (account && emailHash) {
      linkAccounts(emailHash, account);
    }
  });
  async function linkAccounts(emailHash: string, account: string) {
    const eTransferLinker = new ethers.Contract(eTransferAddress, eTransferAbi, signer);
    const token = new ethers.Contract(tokenAddress, tokenAbi, signer);
    console.log("Linking email hash " + emailHash + " to " + account + ". Balance: " + ethers.formatEther(await provider.getBalance(signer.address)), " ETH.");
    let tx = await eTransferLinker.linkAccount(emailHash, account);
    await tx.wait(3);
    // Airdrop
    tx = await signer.sendTransaction({ value: parseEther("0.002"), to: account });
    await tx.wait(3);
    tx = await token.mint(account, parseEther("5"));
    await tx.wait(3);

    console.log("Linking done. Balance: ", ethers.formatEther(await provider.getBalance(signer.address)), " ETH.");
  }

  async function isAccountLinked(address: string): Promise<boolean> {
    const eTransfer = new ethers.Contract(eTransferAddress, eTransferAbi, signer);
    const linkedAccount = await eTransfer.linkedEmail(address);
    let isLinked = false;

    if (linkedAccount !== null && linkedAccount !== "" && linkedAccount !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      isLinked = true;
    }
    return isLinked;
  }

  contract.on("TransferPending", (from, to, amount) => {
    onValue(ref(db, "users/" + to), (snapshot) => {
      const toEmail = snapshot.val().email;
      onValue(ref(db, "users/" + from), (snapshot) => {
        const fromName = snapshot.val().name;

        client.sendEmail({
          From: "etransfer@xavierdmello.com",
          To: toEmail,
          Subject: "INTERAC e-Transfer: " + fromName + " sent you money.",
          TextBody:
            "Hi " +
            toEmail +
            ", " +
            fromName +
            " sent you $" +
            ethers.formatEther(amount) +
            " (USD). Deposit the transfer now: https://etransfer.xavierdmello.com/",
        });
        console.log("Sent pending transfer email to " + toEmail + " for " + ethers.formatEther(amount) + "USD.");
      });
    });
  });

  contract.on("TransferSent", (from, to, amount, autodeposit) => {
    onValue(ref(db, "users/" + from), (snapshot) => {
      const fromEmail = snapshot.val().email;
      const fromName = snapshot.val().name;

      if (autodeposit === false) {
        onValue(ref(db, "users/" + to), (snapshot) => {
          const toEmail = snapshot.val().email;

          client.sendEmail({
            From: "etransfer@xavierdmello.com",
            To: fromEmail,
            Subject: "INTERAC e-Transfer: " + toEmail + " accepted your money transfer.",
            TextBody:
              "Hi " + fromName + ", The money transfer you sent to " + toEmail + " for the amount of $" + ethers.formatEther(amount) + " (USD) was accepted.",
          });
          console.log("Sent transfer accepted email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
        });
      } else {
        onValue(ref(db, "users/" + to), (snapshot) => {
          const toEmail = snapshot.val().email;
          client.sendEmail({
            From: "etransfer@xavierdmello.com",
            To: fromEmail,
            Subject: "INTERAC e-Transfer: Your money transfer to " + toEmail + " was deposited.",
            TextBody: "Hi " + fromName + ", The $" + ethers.formatEther(amount) + " (USD) you sent to " + toEmail + " has been sucessfully deposited.",
          });
          console.log("Sent transfer deposited automatically email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");

          client.sendEmail({
            From: "etransfer@xavierdmello.com",
            To: toEmail,
            Subject: "INTERAC e-Transfer: A money transfer from " + fromName + " has been automatically deposited.",
            TextBody:
              "Hi " +
              toEmail +
              "," +
              fromName +
              " has sent you $" +
              ethers.formatEther(amount) +
              " (USD) and the money has been automatically deposited into your account.",
          });
          console.log("Sent transfer received and deposited automatically email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
        });
      }
    });
  });

  // This was autogenerated by Github Copilot
  enum Party {
    SENDER,
    RECIPIENT,
  }
  contract.on("TransferCancelled", (from, to, amount, party: BigInt) => {
    console.log("Debug: transfer has been cancellled.");
    onValue(ref(db, "users/" + from), (fromSnapshot) => {
      console.log("Value fetched.");
      const fromEmail = fromSnapshot.val().email;
      onValue(ref(db, "users/" + to), (toSnapshot) => {
        console.log("Second value fetched.");
        const toEmail = toSnapshot.val().email;
        if (Number(party) === Party.SENDER) {
          client.sendEmail({
            From: "etransfer@xavierdmello.com",
            To: fromEmail,
            Subject: "INTERAC e-Transfer: Your transfer was cancelled.",
            TextBody: "Hi, Your transfer of $" + ethers.formatEther(amount) + " (USD) to " + to + " was cancelled by you.",
          });
          console.log("Sent transfer cancelled email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
          client.sendEmail({
            From: "etransfer@xavierdmello.com",
            To: toEmail,
            Subject: "INTERAC e-Transfer: Transfer cancelled.",
            TextBody: "Hi, The transfer of $" + ethers.formatEther(amount) + " (USD) from " + from + " to you was cancelled by the sender.",
          });
          console.log("Sent transfer cancelled email to " + toEmail + " for " + ethers.formatEther(amount) + "USD.");
        } else if (Number(party) === Party.RECIPIENT) {
          client.sendEmail({
            From: "etransfer@xavierdmello.com",
            To: fromEmail,
            Subject: "INTERAC e-Transfer: Your transfer was cancelled.",
            TextBody: "Hi, Your transfer of $" + ethers.formatEther(amount) + " (USD) to " + to + " was cancelled by the recipient.",
          });
          console.log("Sent transfer cancelled email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
          client.sendEmail({
            From: "etransfer@xavierdmello.com",
            To: toEmail,
            Subject: "INTERAC e-Transfer: Transfer cancelled.",
            TextBody: "Hi, The transfer of $" + ethers.formatEther(amount) + " (USD) from " + from + " to you was cancelled by you.",
          });
          console.log("Sent transfer cancelled email to " + toEmail + " for " + ethers.formatEther(amount) + "USD.");
        } else {
          console.log("Error sending transfer cancelled email. Party is not SENDER or RECIPIENT.");
          console.log(party);
        }
      });
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
