// Script that deploys a given contract to a network
import hardhat from "hardhat";
const { ethers, network } = hardhat;
import fs from "fs";
import NootToken from '../addresses/Noot.json'

const owner = "0x1Ed3aB46773Dd5789eC5553A7D4b4E2f34d7c7c6";
const paymentToken = NootToken.address;

async function main(CONTRACT_NAME: string) {
  const filepath = `addresses/${CONTRACT_NAME}.json`;

  const args = [owner];

  if (CONTRACT_NAME === "Skins") {
    if (!paymentToken) {
      console.error("Payment token is not set for Skins contract");
      return;
    }

    args.push(paymentToken);
  }

  console.log(`Deploying ${CONTRACT_NAME} contract to ${network.name}`);
  const contract = await ethers.deployContract(CONTRACT_NAME, args, {});
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`${CONTRACT_NAME} deployed to ${contractAddress}`);

  fs.writeFileSync(
    filepath,
    JSON.stringify(
      {
        address: contractAddress,
      },
      null,
      2,
    ),
  );

  console.log(`Contract address written to ${filepath}`);
  console.log(
    "Make sure to restart you next dev server to read the new contract",
  );
}

(async () => {
  await main("Powerups");
  await main("Registry");
  await main("Skins");

  process.exit(0);
})();
