const { expect } = require("chai");
const { ethers } = require("hardhat");
const tokenJSON = require("../artifacts/contracts/Erc.sol/DCToken.json");

describe("Launchpad", () => {
  let owner;
  let buyer;
  let shop;
  let erc20;

  beforeEach(async () => {
    [owner, buyer] = await ethers.getSigners();

    const Launchpad = await ethers.getContractFactory("Launchpad", owner);
    shop = await Launchpad.deploy();
    await shop.waitForDeployment();

    erc20 = new ethers.Contract(await shop.token(), tokenJSON.abi, owner);
  });

  it("should have an owner and a token", async () => {
    expect(await shop.owner()).to.eq(owner.address);

    expect(await shop.token()).to.be.properAddress;
  });

  it("allows to buy", async () => {
    const tokenAmount = 4;
    const txData = {
      value: tokenAmount,
      to: shop.target,
    }

    const tx = await buyer.sendTransaction(txData);
    await tx.wait();

    console.log(erc20);

    expect(await erc20.balanceOf(buyer.address)).to.eq(tokenAmount);

    await expect(() => tx).to.changeEtherBalance(shop, tokenAmount);

    await expect(tx).to.emit(shop, "Bought").withArgs(tokenAmount, buyer.address);
  });

  it("allows to sell", async () => {
    const tx = await buyer.sendTransaction({ value: 3, to: shop.target });
    await tx.wait();

    const sellAmount = 2;

    const approval = await erc20.connect(buyer).approve(shop.target, sellAmount);

    await approval.wait();

    const sellTx = await shop.connect(buyer).sell(sellAmount);

    expect(await erc20.balanceOf(buyer.address)).to.eq(1);
  });
});


