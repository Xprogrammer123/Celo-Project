import * as dotenv from "dotenv";
import { Wallet } from "ethers";
dotenv.config();

function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("No private key");
  const wallet = new Wallet(pk);
  console.log("Your Wallet Address is:", wallet.address);
}
main();
