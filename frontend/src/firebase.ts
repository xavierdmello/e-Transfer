import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, set, onValue } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://e-transfer-prod-default-rtdb.firebaseio.com/",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
