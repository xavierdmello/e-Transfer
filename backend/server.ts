import { ethers } from "ethers";
import eTransferAbi from "./eTransferAbi";
import "dotenv/config";
import * as postmark from "postmark";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const RPC = process.env.RPC!;
const POSTMARK_KEY = process.env.POSTMARK_KEY!;
const eTransferAddress = "0x047CbFe0a82cad48b0c672eF73475955d6c7a2f2";
let client = new postmark.ServerClient(POSTMARK_KEY);

const firebaseConfig = {
  databaseURL: "https://e-transfer-dev-default-rtdb.firebaseio.com/",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function main() {
  const provider = new ethers.WebSocketProvider(RPC);
  const contract = new ethers.Contract(eTransferAddress, eTransferAbi, provider);

  console.log("e-Transfer server started.");

  contract.on("TransferPending", (from, to, amount) => {
    onValue(ref(db, "users/" + to), (snapshot) => {
      const toEmail = snapshot.val();
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
      const fromEmail = snapshot.val();
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
          const toEmail = snapshot.val();
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
        console.log("Sent transfer recieved and deposited automatically email to " + fromEmail + " for " + ethers.formatEther(amount) + "USD.");
      }
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
