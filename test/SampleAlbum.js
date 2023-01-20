const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
    RANDOM_PROVIDER_CONTRACT,
    REGISTAR_CONTRACT,
    ALBUM_CONTRACT,
    generateAlbumItems
} = require("./utils");

describe("SampleAlbum", () => {

    const ETH_IN_WEI = ethers.utils.parseUnits('1', 'ether');
    let albumItems = [];
    let minPackSize = 3;
    let maxPackSize = 10;
    let pricePerCard = ETH_IN_WEI;
    let initialFees = 20;

    async function albumContractFixture() {

        const [account01, account02] = await ethers.getSigners();

        const Random = await ethers.getContractFactory(RANDOM_PROVIDER_CONTRACT);
        const random = await Random.deploy();
        await random.deployed();

        const SampleAlbum = await ethers.getContractFactory(ALBUM_CONTRACT);
        const sampleAlbum = await SampleAlbum.deploy(
            albumItems,
            account01.address,
            minPackSize,
            maxPackSize,
            pricePerCard,
            initialFees,
            random.address,
            account02.address
        )
        await sampleAlbum.deployed();

        return { creator: account01, dev: account02, album: sampleAlbum };
    }

    describe("Deployment", () => {

        it("Should be able to deploy sample album and set it up via constructor parameters", async () => {

            const ETH_IN_WEI = ethers.utils.parseUnits('1', 'ether');
            albumItems = generateAlbumItems(250);
            minPackSize = 5;
            maxPackSize = 10;
            initialFees = 10;
            pricePerCard = ETH_IN_WEI;

            const { album, creator } = await loadFixture(albumContractFixture);

            const _creatorAddr = await album.creator();
            const seededCards = await album.availableCards();
            const minPack = await album.minPackSize();
            const maxPack = await album.maxPackSize();
            const singleCardPrice = await album.pricePerCard();

            expect(seededCards.length).to.equal(albumItems.length);
            expect(_creatorAddr).to.equal(creator.address);

            expect(singleCardPrice).to.equal(ETH_IN_WEI);
            expect(maxPack.toNumber()).to.equal(maxPackSize);
            expect(minPack.toNumber()).to.equal(minPackSize)
        })
    })

    describe("Populating Album", () => {

        it.only("User should be able to draw cards specified by range and pay specified ammount", async () => {
            
            albumItems = generateAlbumItems(250);
            minPackSize = 3;
            maxPackSize = 6;
            initialFees = 20;
            pricePerCard = ethers.utils.parseUnits('1', 'ether');

            const [_, playerOne] = await ethers.getSigners();

            const { album } = await loadFixture(albumContractFixture);

            const validPackSize = 5;
            const validPackPrice = pricePerCard.mul(validPackSize);

            const tx = await album.connect(playerOne).openPack(playerOne.address, validPackSize, {value: validPackPrice});
            const resp = await tx.wait();

            expect(resp.events.length == 1).to.be.true;

            // asserting that a single PackOpened event gets thrown
            // and event contains ids of drawn cards
            const packOpenedEvent = resp.events[0];
            expect(packOpenedEvent.event).to.equal("PackOpened")

            const drawnCards = packOpenedEvent.args.drawnCards;
            const cardsOwner = packOpenedEvent.args.cardsOwner;

            // asseting that an account is the owner of drawn cards
            expect(drawnCards.length).to.equal(validPackSize);
            expect(cardsOwner).to.equal(playerOne.address);

            for (let i = 0; i < drawnCards.length; i++) {
                const ownedCardsCount = await album.ownedCardsCount(playerOne.address, drawnCards[i].toNumber());
                expect(ownedCardsCount).to.be.greaterThan(0);
            }

            // assert that part of the price went into prize pool
            // prize pool formula packPrice - creatorFees
            const FIVE_ETH = ethers.utils.parseUnits('5', 'ether');
            const fees = FIVE_ETH.div(1000).mul(initialFees);
            
            const expectedPrizePool = FIVE_ETH.sub(fees);
            const prizePool = await album.prizePool();
        
            expect(prizePool).to.equal(expectedPrizePool);
        })

        it("account should not be able to purchase an invalid pack size", () => {
            
        })
    })

    // describe("Functionality", () => {

    //     it("should open pack of packSize number and asign them to owner", async () => {

    //         const _albumItems = [];
    //         for (var i = 0; i < 100; i++) {
    //             _albumItems.push({ id: i + 1, name: `Name#${i + 1}` });
    //         }
    //         albumItems = _albumItems;
    //         packSize = 5;
    //         packPrice = ethers.utils.parseUnits('0.000001', 'ether');

    //         const { sampleAlbum, owner, rand } = await loadFixture(albumContractFixture);

    //         //    const drawResponse = await sampleAlbum.openPack(owner.address, {value: packPrice});

    //         await expect(sampleAlbum.openPack(owner.address, { value: packPrice })).to.changeEtherBalances(
    //             [owner, sampleAlbum],
    //             [-packPrice.toNumber(), packPrice.toNumber()]
    //         );

    //         let resp1 = await sampleAlbum.openPack(owner.address, { value: packPrice });
    //         resp1 = await resp1.wait();
    //         console.log(resp1.events.length);
    //         console.log(resp1.events[0]);
    //     })
    // })

    // describe("Deployment", () => {

    //     it("should test random generation", async () => {

    //         // albumItems = [{ id: 1, name: "name#1" }, { id: 2, name: "name#2" }, { id: 3, name: "name#3" }, { id: 4, name: "name#4" }, { id: 5, name: "name#5" }]

    //         const {sampleAlbum, owner, rand} = await loadFixture(albumContractFixture);

    //         console.log("here!")
    //         const res = await rand.rand(5,5);
    //         console.log(res, " FROM RANDOM")
    //     })

    // it("should generate proper items", async () => {

    //     albumItems = [{ id: 1, name: "name#1" }, { id: 2, name: "name#2" }, { id: 3, name: "name#3" }, { id: 4, name: "name#4" }, { id: 5, name: "name#5" }]

    //     const { sampleAlbum, owner } = await loadFixture(albumContractFixture);

    //     for (var i = 0; i < albumItems.length; i++ ) {
    //         const currentItem = albumItems[i];
    //         const value = await sampleAlbum.itemIds(i);
    //         const itemId = value.toNumber();

    //         expect(itemId).to.equals(currentItem.id);
    //         const savedItem = await sampleAlbum.itemIdToItem(itemId);

    //         const savedItemId = savedItem[0].toNumber();
    //         const savedItemName = savedItem[1];

    //         expect(savedItemId).to.equal(currentItem.id);
    //         expect(savedItemName).to.equal(currentItem.name);
    //     }
    // })
    // })
})