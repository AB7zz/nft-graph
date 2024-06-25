
const hre = require("hardhat");

async function main() {

  const marketplace = await hre.ethers.deployContract("Marketplace");
  await marketplace.waitForDeployment();
  
  const nft = await hre.ethers.deployContract("NFT");
  await nft.waitForDeployment();

  console.log(
    `Marketplace - ${marketplace.target}`
  );
  console.log(
    `NFT - ${nft.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
