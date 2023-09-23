import { getDatabase, ref, set, onValue, onChildAdded } from "firebase/database";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  databaseURL: "https://e-transfer-daa7e-default-rtdb.firebaseio.com/",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
