import { ethers } from "ethers";
import eTransferAbi from "./eTransferAbi";
import "dotenv/config";
import * as postmark from "postmark";
import { ref, set, onValue, onChildAdded, onChildChanged } from "firebase/database";
import db from "./firebase";

const RPC = process.env.RPC!;
const POSTMARK_KEY = process.env.POSTMARK_KEY!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const eTransferAddress = "0x047CbFe0a82cad48b0c672eF73475955d6c7a2f2";

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

          if ("account && emailHash") {
            try {
              const isLinked: boolean = await isAccountLinked(account);

              if (isLinked === false) {
                console.log(`Account ${accountData.email} is not linked. Linking now. (2/2)`);
                await linkAccounts(emailHash, account);
              } else {
                console.log(`Account ${accountData.email} is linked. All good. (2/2)`);
              }
            } catch (err) {
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

    console.log("Linking email hash " + emailHash + " to " + account + ". Balance: " + ethers.formatEther(await provider.getBalance(signer.address)), " ETH.");
    await eTransferLinker.linkAccount(emailHash, account);
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
      client.sendEmail({
        From: "etransfer@xavierdmello.com",
        To: toEmail,
        Subject: "INTERAC e-Transfer: " + from + " sent you money.",
        TextBody: "Hi " + toEmail + ", " + from + " sent you $" + ethers.formatEther(amount) + " (USD).",
      });
      console.log("Sent pending transfer email to " + toEmail + " for " + ethers.formatEther(amount) + "USD.");
    });
  });

  contract.on("TransferSent", (from, to, amount, autodeposit) => {
    onValue(ref(db, "users/" + from), (snapshot) => {
      const fromEmail = snapshot.val().email;
      if (autodeposit === false) {
        client.sendEmail({
          From: "etransfer@xavierdmello.com",
          To: fromEmail,
          Subject: "INTERAC e-Transfer: " + to + " accepted your money transfer.",
          TextBody: "Hi " + fromEmail + ", The money transfer you sent to " + to + " for the amount of $" + ethers.formatEther(amount) + " (USD) was accepted.",
        });
        console.log("Sent transfer accepted email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
      } else {
        client.sendEmail({
          From: "etransfer@xavierdmello.com",
          To: fromEmail,
          Subject: "INTERAC e-Transfer: Your money transfer to " + to + " was deposited.",
          TextBody: "Hi " + fromEmail + ", The $" + ethers.formatEther(amount) + " (USD) you sent to " + to + " has been sucessfully deposited.",
        });
        console.log("Sent transfer deposited automatically email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");

        onValue(ref(db, "users/" + to), (snapshot) => {
          const toEmail = snapshot.val().email;
          client.sendEmail({
            From: "etransfer@xavierdmello.com",
            To: toEmail,
            Subject: "INTERAC e-Transfer: A money transfer from " + from + " has been automatically deposited.",
            TextBody:
              "Hi " +
              toEmail +
              "," +
              from +
              " has sent you $" +
              ethers.formatEther(amount) +
              " (USD) and the money has been automatically deposited into your account.",
          });
        });
        console.log("Sent transfer received and deposited automatically email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
      }
    });
  });

  // This was autogenerated by Github Copilot
  enum Party {
    SENDER,
    RECIPIENT,
  }
  contract.on("TransferCancelled", (from, to, amount, party) => {
    onValue(ref(db, "users/" + from), (fromSnapshot) => {
      const fromEmail = fromSnapshot.val().email;
      onValue(ref(db, "users/" + to), (toSnapshot) => {
        const toEmail = toSnapshot.val().email;
        if (party === Party.SENDER) {
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
        } else if (party === Party.RECIPIENT) {
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
        }
      });
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
