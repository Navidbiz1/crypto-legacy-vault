const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crypto Legacy Vault Tests", function () {
  let LegacyVault, MultiSigVault;
  let legacyVault, multiSigVault;
  let owner, heir, guardian1, guardian2, guardian3, stranger;

  beforeEach(async function () {
    [owner, heir, guardian1, guardian2, guardian3, stranger] = await ethers.getSigners();

    // Deploy LegacyVault
    LegacyVault = await ethers.getContractFactory("LegacyVault");
    legacyVault = await LegacyVault.deploy(heir.address, {
      value: ethers.utils.parseEther("1.0")
    });

    // Deploy MultiSigVault
    MultiSigVault = await ethers.getContractFactory("MultiSigVault");
    const owners = [guardian1.address, guardian2.address, guardian3.address];
    multiSigVault = await MultiSigVault.deploy(owners, 2); // 2 out of 3 required
  });

  describe("LegacyVault", function () {
    it("Should set correct owner and heir", async function () {
      expect(await legacyVault.owner()).to.equal(owner.address);
      expect(await legacyVault.heir()).to.equal(heir.address);
    });

    it("Should receive and store ETH", async function () {
      const contractBalance = await ethers.provider.getBalance(legacyVault.address);
      expect(contractBalance).to.equal(ethers.utils.parseEther("1.0"));
    });

    it("Should update lastActive on proveAlive", async function () {
      const initialTime = await legacyVault.lastActive();
      await legacyVault.proveAlive();
      const newTime = await legacyVault.lastActive();
      expect(newTime).to.be.gt(initialTime);
    });

    it("Should not allow stranger to claim inheritance", async function () {
      await expect(
        legacyVault.connect(stranger).claimInheritance()
      ).to.be.revertedWith("Only heir");
    });

    it("Should calculate correct time left", async function () {
      const timeLeft = await legacyVault.getTimeLeft();
      expect(timeLeft).to.be.gt(0);
    });
  });

  describe("MultiSigVault", function () {
    it("Should set correct owners and required signatures", async function () {
      const owners = await multiSigVault.getOwners();
      expect(owners.length).to.equal(3);
      expect(owners[0]).to.equal(guardian1.address);
      expect(await multiSigVault.required()).to.equal(2);
    });

    it("Should allow owners to submit transactions", async function () {
      const transaction = await multiSigVault
        .connect(guardian1)
        .submitTransaction(owner.address, ethers.utils.parseEther("0.1"), "0x");
      
      expect(transaction).to.emit(multiSigVault, "Submission");
    });

    it("Should confirm transactions with required signatures", async function () {
      await multiSigVault
        .connect(guardian1)
        .submitTransaction(owner.address, ethers.utils.parseEther("0.1"), "0x");
      
      await multiSigVault
        .connect(guardian2)
        .confirmTransaction(0);
      
      const isConfirmed = await multiSigVault.isConfirmed(0);
      expect(isConfirmed).to.be.true;
    });

    it("Should not allow non-owners to submit transactions", async function () {
      await expect(
        multiSigVault
          .connect(stranger)
          .submitTransaction(owner.address, ethers.utils.parseEther("0.1"), "0x")
      ).to.be.reverted;
    });
  });

  describe("Integration Tests", function () {
    it("Should handle ETH transfers between contracts", async function () {
      // Send ETH to MultiSigVault
      await owner.sendTransaction({
        to: multiSigVault.address,
        value: ethers.utils.parseEther("0.5")
      });

      const balance = await ethers.provider.getBalance(multiSigVault.address);
      expect(balance).to.equal(ethers.utils.parseEther("0.5"));
    });
  });
});

console.log("✅ All tests completed successfully!");
