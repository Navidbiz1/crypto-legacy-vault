const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of Crypto Legacy Vault...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy LegacyVault
  console.log("\n📄 Deploying LegacyVault...");
  const LegacyVault = await ethers.getContractFactory("LegacyVault");
  
  // Replace with actual heir address - this is just an example
  const heirAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  const legacyVault = await LegacyVault.deploy(heirAddress, {
    value: ethers.utils.parseEther("0.1") // Send 0.1 ETH with deployment
  });
  
  await legacyVault.deployed();
  console.log("✅ LegacyVault deployed to:", legacyVault.address);
  console.log("👤 Owner:", await legacyVault.owner());
  console.log("👥 Heir:", await legacyVault.heir());
  console.log("💸 Contract balance:", 
    ethers.utils.formatEther(await ethers.provider.getBalance(legacyVault.address)), "ETH");

  // Deploy MultiSigVault
  console.log("\n📄 Deploying MultiSigVault...");
  const MultiSigVault = await ethers.getContractFactory("MultiSigVault");
  
  // Example owners - replace with actual addresses
  const owners = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  ];
  const required = 2; // 2 out of 3 signatures required
  
  const multiSigVault = await MultiSigVault.deploy(owners, required);
  await multiSigVault.deployed();
  
  console.log("✅ MultiSigVault deployed to:", multiSigVault.address);
  console.log("👥 Owners:", await multiSigVault.getOwners());
  console.log("🔢 Required signatures:", (await multiSigVault.required()).toString());

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("   LegacyVault:", legacyVault.address);
  console.log("   MultiSigVault:", multiSigVault.address);
  
  // Save addresses to a file (optional)
  const addresses = {
    legacyVault: legacyVault.address,
    multiSigVault: multiSigVault.address,
    network: (await ethers.provider.getNetwork()).name
  };
  
  console.log("\n💾 Save these addresses for future reference!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
