import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, set, onValue } from "firebase/database";
import {databaseURL} from "../../config"
const firebaseConfig = {
  databaseURL: databaseURL,
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
