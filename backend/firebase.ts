import { getDatabase, ref, set, onValue, onChildAdded } from "firebase/database";
import { initializeApp } from "firebase/app";
import { databaseURL } from "../config";
const firebaseConfig = {
  databaseURL: databaseURL,
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
