
const hre = require("hardhat");

async function main() {

  const nft = await hre.ethers.deployContract("NFTContract");
  await nft.waitForDeployment();

  const marketplace = await hre.ethers.deployContract("Marketplace", [nft.target]);
  await marketplace.waitForDeployment();
  

  console.log(
    `NFT - ${nft.target}`
  );
  
  console.log(
    `Marketplace - ${marketplace.target}`
  );

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
