// Script that deploys a given contract to a network
import hardhat from "hardhat";
const { ethers, network } = hardhat;
import fs from "fs";

async function main() {
  const CONTRACT_NAME = "Greeter";

  const filepath = `artifacts-zk/contracts/${CONTRACT_NAME}.sol/${CONTRACT_NAME}.json`;

  if (!fs.existsSync(filepath)) {
    throw new Error(
      `Contract artifact not found at ${filepath}. Make sure to compile the contract first, and that the filename matches the contract name.`,
    );
  }

  console.log(`Deploying ${CONTRACT_NAME} contract to ${network.name}`);
  const contract = await ethers.deployContract(CONTRACT_NAME, [], {});
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
