import { ethers, parseEther, NonceManager } from "ethers";
import eTransferAbi from "../abi/eTransferAbi";
import "dotenv/config";
import { ref, set, onValue, onChildAdded, onChildChanged, get } from "firebase/database";
import db from "./firebase";
import { ETRANSFER_ADDRESS, TOKEN_ADDRESS } from "../config";
import tokenAbi from "../abi/tokenAbi";

const RPC = process.env.RPC!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const SENDGRID_KEY = process.env.SENDGRID_KEY!;

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(SENDGRID_KEY);

// Order of events:
// 1. On startup: server goes through all account in the database, makes sure they're linked, and if not, links them.
// 2. Server goes into listening mode, and sends emails/links accounts as needed.

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const provider = new ethers.JsonRpcProvider(RPC);
const contract = new ethers.Contract(ETRANSFER_ADDRESS, eTransferAbi, provider);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const nonceManager = new NonceManager(signer);

async function main() {
  console.log("e-Transfer server started.");

  const newAccountRef = ref(db, "users/");
  let initialDataLoaded = false;
  onValue(newAccountRef, () => {
    initialDataLoaded = true;
  });
  onChildAdded(newAccountRef, (snapshot) => {
    async function linkAccountsWait() {
      const emailHash = snapshot.key;
      const accountData = snapshot.val();
      const account = accountData.address;

      if (account && emailHash) {
        await linkAccounts(emailHash, account);
      }
    }
    if (initialDataLoaded == true) {
      linkAccountsWait();
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
              await delay(Math.random() * 10_000); // Random delay to prevent RPC rate limit
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
    async function linkAccountsWait() {
      const emailHash = snapshot.key;
      const accountData = snapshot.val();
      const account = accountData.address;

      if (account && emailHash) {
        linkAccounts(emailHash, account);
      }
    }

    linkAccountsWait();
  });
  async function linkAccounts(emailHash: string, account: string) {
    const eTransferLinker = new ethers.Contract(ETRANSFER_ADDRESS, eTransferAbi, nonceManager);
    const token = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, nonceManager);

    // 1. Make sure account isn't already linked. Could happen with all these async/await calls.
    const isLinked: boolean = await isAccountLinked(account);
    if (isLinked === true) {
      console.log("Account " + account + " is already linked. Skipping.");
      return;
    } else {
      //2. Link if not linked.
      console.log("Account " + account + " is not linked. Linking now.");
      console.log(
        "Linking email hash " + emailHash + " to " + account + ". Balance: " + ethers.formatEther(await provider.getBalance(signer.address)),
        " ETH."
      );
      let tx = await eTransferLinker.linkAccount(emailHash, account);
      await tx.wait();
      // Airdrop
      tx = await nonceManager.sendTransaction({ value: parseEther("0.002"), to: account });
      await tx.wait();
      tx = await token.mint(account, parseEther("5"));
      await tx.wait();

      console.log("Linking done. Balance: ", ethers.formatEther(await provider.getBalance(signer.address)), " ETH.");
    }
  }

  async function isAccountLinked(address: string): Promise<boolean> {
    const eTransfer = new ethers.Contract(ETRANSFER_ADDRESS, eTransferAbi, nonceManager);
    const linkedAccount = await eTransfer.linkedEmail(address);
    let isLinked = false;

    if (linkedAccount !== null && linkedAccount !== "" && linkedAccount !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      isLinked = true;
    }
    return isLinked;
  }

  contract.on("TransferPending", (from, to, amount) => {
    get(ref(db, "users/" + to)).then((snapshot) => {
      if (snapshot.exists()) {
        const toEmail = snapshot.val().email;
        get(ref(db, "users/" + from)).then((snapshot) => {
          if (snapshot.exists()) {
            const fromName = snapshot.val().name;

            const msg = {
              to: toEmail,
              from: "etransfer@xavierdmello.com",
              subject: "INTERAC e-Transfer: " + fromName + " sent you money.",
              text:
                "Hi " +
                toEmail +
                ",\n\n" +
                fromName +
                " sent you $" +
                ethers.formatEther(amount) +
                " (USD). Deposit the transfer now: https://etransfer.xavierdmello.com/",
            };

            sgMail
              .send(msg)
              .then(() => {
                console.log("Sent pending transfer email to " + toEmail + " for " + ethers.formatEther(amount) + "USD.");
              })
              .catch((error: any) => {
                if (error instanceof Error) {
                  console.error(error);
                }
              });
          } else {
            console.error("no snapshot for " + from);
          }
        });
      } else {
        console.error("no snapshot for " + to);
      }
    });
  });

  contract.on("TransferSent", (from, to, amount, autodeposit) => {
    get(ref(db, "users/" + from)).then((snapshot) => {
      const fromEmail = snapshot.val().email;
      const fromName = snapshot.val().name;

      if (autodeposit === false) {
        get(ref(db, "users/" + to)).then((snapshot) => {
          const toEmail = snapshot.val().email;
          const msg = {
            to: fromEmail,
            from: "etransfer@xavierdmello.com",
            subject: "INTERAC e-Transfer: " + toEmail + " accepted your money transfer.",
            text:
              "Hi " +
              fromName +
              ",\n\nThe money transfer you sent to " +
              toEmail +
              " for the amount of $" +
              ethers.formatEther(amount) +
              " (USD) was accepted.",
          };
          sgMail
            .send(msg)
            .then(() => {
              console.log("Sent transfer accepted email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
            })
            .catch((error: any) => {
              if (error instanceof Error) {
                console.error(error);
              }
            });
        });
      } else {
        get(ref(db, "users/" + to)).then((snapshot) => {
          const toEmail = snapshot.val().email;
          let msg = {
            to: fromEmail,
            from: "etransfer@xavierdmello.com",
            subject: "INTERAC e-Transfer: Your money transfer to " + toEmail + " was deposited.",
            text: "Hi " + fromName + ",\n\nThe $" + ethers.formatEther(amount) + " (USD) you sent to " + toEmail + " has been sucessfully deposited.",
          };
          sgMail
            .send(msg)
            .then(() => {
              console.log("Sent transfer deposited automatically email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
            })
            .catch((error: any) => {
              if (error instanceof Error) {
                console.error(error);
              }
            });

          msg = {
            to: toEmail,
            from: "etransfer@xavierdmello.com",
            subject: "INTERAC e-Transfer: A money transfer from " + fromName + " has been automatically deposited.",
            text:
              "Hi " +
              toEmail +
              ",\n\n" +
              fromName +
              " has sent you $" +
              ethers.formatEther(amount) +
              " (USD) and the money has been automatically deposited into your account.",
          };
          sgMail
            .send(msg)
            .then(() => {
              console.log("Sent transfer received and deposited automatically email to " + toEmail + " for " + ethers.formatEther(amount) + "USD.");
            })
            .catch((error: any) => {
              if (error instanceof Error) {
                console.error(error);
              }
            });
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
    get(ref(db, "users/" + from)).then((fromSnapshot) => {
      console.log("Value fetched.");
      const fromEmail = fromSnapshot.val().email;
      const fromName = fromSnapshot.val().name;
      get(ref(db, "users/" + to)).then((toSnapshot) => {
        console.log("Second value fetched.");
        const toEmail = toSnapshot.val().email;
        if (Number(party) === Party.SENDER) {
          let msg = {
            to: fromEmail,
            from: "etransfer@xavierdmello.com",
            subject: "INTERAC e-Transfer: Your transfer was cancelled.",
            text: "Hi " + fromName + ",\n\nYour transfer of $" + ethers.formatEther(amount) + " (USD) to " + to + " was cancelled by you.",
          };
          sgMail
            .send(msg)
            .then(() => {
              console.log("Sent transfer cancelled email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
            })
            .catch((error: any) => {
              if (error instanceof Error) {
                console.error(error);
              }
            });

          msg = {
            to: toEmail,
            from: "etransfer@xavierdmello.com",
            subject: "INTERAC e-Transfer: Transfer cancelled.",
            text: "Hi,\n\nThe transfer of $" + ethers.formatEther(amount) + " (USD) from " + from + " to you was cancelled by the sender.",
          };
          sgMail
            .send(msg)
            .then(() => {
              console.log("Sent transfer cancelled email to " + toEmail + " for " + ethers.formatEther(amount) + "USD.");
            })
            .catch((error: any) => {
              if (error instanceof Error) {
                console.error(error);
              }
            });
        } else if (Number(party) === Party.RECIPIENT) {
          let msg = {
            to: fromEmail,
            from: "etransfer@xavierdmello.com",
            subject: "INTERAC e-Transfer: Your transfer was cancelled.",
            text: "Hi " + fromName + ",\n\nYour transfer of $" + ethers.formatEther(amount) + " (USD) to " + to + " was cancelled by the recipient.",
          };
          sgMail
            .send(msg)
            .then(() => {
              console.log("Sent transfer cancelled email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
            })
            .catch((error: any) => {
              if (error instanceof Error) {
                console.error(error);
              }
            });

          msg = {
            to: toEmail,
            from: "etransfer@xavierdmello.com",
            subject: "INTERAC e-Transfer: Transfer cancelled.",
            text: "Hi,\n\nThe transfer of $" + ethers.formatEther(amount) + " (USD) from " + from + " to you was cancelled by you.",
          };
          sgMail
            .send(msg)
            .then(() => {
              console.log("Sent transfer cancelled email to " + toEmail + " for " + ethers.formatEther(amount) + "USD.");
            })
            .catch((error: any) => {
              if (error instanceof Error) {
                console.error(error);
              }
            });
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
