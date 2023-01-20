const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {RANDOM_PROVIDER_CONTRACT} = require("./utils");

describe("Random Provider", () => {
    async function randomProviderFixture() {
        const RandProvider = await ethers.getContractFactory(RANDOM_PROVIDER_CONTRACT);
        const rand = await RandProvider.deploy();
        await rand.deployed();

        return rand;
    }

    it("should provide an array of random number in range of 1 - len param", async() => {
        const r = await loadFixture(randomProviderFixture);
        const len = 150;
        const range = 5;

        const seed = await r.randRange(len, range);
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
        const seed01 = await r.randRange(len, range);
        const seed02 = await r.connect(account02).randRange(len, range);

        let diff = 10;
        for (var i =  0; i < range; i++) {
            if (seed01[i].toNumber() == seed02[i].toNumber()) {
                diff--;
            }
        }
        expect(diff > 0).to.be.true;
    })

    it("should generate a signle random number in range of 0 - range parameter, different for accounts", async () => {
       
        const r = await loadFixture(randomProviderFixture);
        const range = 9999;

        const [_, account02] = await ethers.getSigners();
        const seed01 = await r.randSingle(range);
        const seed02 = await r.connect(account02).randSingle(range);

        // we are generating random numbers in range 1-9999 and asserting that they are different for two accounts
        // since the numbers are random, there is a small probablility that this tests sometimes
        // generates same numbers. Its a low probability, but still possible.
        expect(seed01).to.not.equal(seed02);
    })
})