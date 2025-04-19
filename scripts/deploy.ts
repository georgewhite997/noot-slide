// Script that deploys a given contract to a network
import hardhat from "hardhat";
const { ethers, network } = hardhat;
import fs from "fs";


async function main(CONTRACT_NAME: string) {
  const filepath = `artifacts-zk/contracts/${CONTRACT_NAME}.sol/${CONTRACT_NAME}.json`;

  if (!fs.existsSync(filepath)) {
    throw new Error(
      `Contract artifact not found at ${filepath}. Make sure to compile the contract first, and that the filename matches the contract name.`,
    );
  }

  const owner = "0x1Ed3aB46773Dd5789eC5553A7D4b4E2f34d7c7c6";

  console.log(`Deploying ${CONTRACT_NAME} contract to ${network.name}`);
  const contract = await ethers.deployContract(CONTRACT_NAME, [owner], {});
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`${CONTRACT_NAME} deployed to ${contractAddress}`);

  const file = fs.readFileSync(filepath, "utf8");
  const contractArtifact = JSON.parse(file);

  fs.writeFileSync(
    filepath,
    JSON.stringify(
      {
        ...contractArtifact,
        address: contractAddress,
      },
      null,
      2,
    ),
  );

  console.log(`Contract address written to ${filepath}`);
  console.log(
    "Make sure to restart you next dev server to read the new contract address",
  );
}

(async () => {
  // await main("Skins");
  // await main("Powerups");
  // await main("Registry");

  process.exit(0);
})();
