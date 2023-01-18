const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Random Provider", () => {
    async function randomProviderFixture() {
        const RandProvider = await ethers.getContractFactory("RandomProvider");
        const rand = await RandProvider.deploy();
        await rand.deployed();

        return rand;
    }

    it("should provide an array of random number in range of 1 - len param", async() => {
        const r = await loadFixture(randomProviderFixture);
        const len = 150;
        const range = 5;

        const seed = await r.rand(len, range);
        const seedArr = seed.map(s => s.toNumber());

        expect(seedArr.length).to.equal(range);
        await seedArr.forEach(async (i) => {
            expect(i > 1 && i < len).to.be.true();
        })
    })

    it("should generate different seeds for different accounts on a same block",async () => {
        const r = await loadFixture(randomProviderFixture);
        const len = 350;
        const range = 10;

        const [_, account02] = await ethers.getSigners();
        const seed01 = await r.rand(len, range);
        const seed02 = await r.connect(account02).rand(len, range);

        let diff = 10;
        for (var i =  0; i < range; i++) {
            if (seed01[i].toNumber() == seed02[i].toNumber()) {
                diff--;
            }
        }
        expect(diff > 0).to.be.true;
    })
})