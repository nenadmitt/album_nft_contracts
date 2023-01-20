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
    RARE_CARD_DRAWN_EVENT,
    PACK_OPENED_EVENT,
    generateAlbumItems
} = require("./utils");

describe("SampleAlbum", () => {

    const ETH_IN_WEI = ethers.utils.parseUnits('1', 'ether');
    let commonCards = generateAlbumItems(50);
    let rareCards = generateAlbumItems(10);
    let minPackSize = 3;
    let maxPackSize = 10;
    let pricePerCard = ETH_IN_WEI;
    let creatorFees = 100 // 10 %;
    let rareCardDrawChance = 1000; // 100%;

    async function assertUserIsCardOwner(album, address, cardIds) {

        for (let i = 0; i < cardIds.length; i++) {
            const ownedCardsCount = await album.ownedCardsCount(address, cardIds[i])
            expect(ownedCardsCount.toNumber() > 0).to.be.true;
        }
    }

    async function assertProperFeesAndFeePools(album, packPrice, creatorFees) {
     
        const _creatorFees = packPrice.div(1000).mul(creatorFees);
        const expectedPrizePool = packPrice.sub(_creatorFees);

        const prizePool = await album.prizePool();
        expect(prizePool).to.equal(expectedPrizePool);
    }

    async function albumContractFixture() {

        const [account01, account02, account03] = await ethers.getSigners();

        const Random = await ethers.getContractFactory(RANDOM_PROVIDER_CONTRACT);
        const random = await Random.deploy();
        await random.deployed();

        const SampleAlbum = await ethers.getContractFactory(ALBUM_CONTRACT);
        const sampleAlbum = await SampleAlbum.deploy(
            commonCards,
            rareCards,
            account01.address,
            minPackSize,
            maxPackSize,
            pricePerCard,
            creatorFees,
            rareCardDrawChance,
            random.address,
            account02.address
        )
        await sampleAlbum.deployed();

        return { creator: account01, dev: account02, album: sampleAlbum, user: account03 };
    }

    describe("Deployment", () => {

        it("Should be able to deploy sample album and set it up via constructor parameters", async () => {

            const { album, creator } = await loadFixture(albumContractFixture);

            const _creatorAddr = await album.creator();
            const availableCommonCards = await album.availableCommonCards();
            const availableRareCards =  await album.availableRareCards();
            const minPack = await album.minPackSize();
            const maxPack = await album.maxPackSize();
            const singleCardPrice = await album.pricePerCard();

            expect(availableCommonCards.length).to.equal(commonCards.length);
            expect(availableRareCards.length).to.equal(rareCards.length);

            expect(_creatorAddr).to.equal(creator.address);

            expect(singleCardPrice).to.equal(ETH_IN_WEI);
            expect(maxPack.toNumber()).to.equal(maxPackSize);
            expect(minPack.toNumber()).to.equal(minPackSize)
        })
    })

    describe("Populating Album", () => {


        it("should NOT be able to open pack with invalid size or invalid pack price", async() => {

            const { album, user } = await loadFixture(albumContractFixture);

            const invalidPackSize = maxPackSize + 1;
            const invalidPackPrice = ethers.utils.parseUnits('0.01', 'ether');
            
            await expect (album.connect(user).openPack(user.address, invalidPackSize, { value: invalidPackPrice }))
                .to.be.revertedWith("Album doesn't support provided pack size");

            const validPackSize = maxPackSize - 1;
        
            await expect (album.connect(user).openPack(user.address, validPackSize, { value: invalidPackPrice }))
            .to.be.revertedWith("Not enough funds for purchasing a pack.");
        })

        it("should be able to by a card pack with valid size and get ownership of drawn cards", async () => {

            const { album,user} = await loadFixture(albumContractFixture);

            const packSize = maxPackSize - 1;
            const packPrice = pricePerCard.mul(packSize);

            const tx = await album.connect(user).openPack(user.address, packSize, {value: packPrice});
            const resp = await tx.wait();

            const pack = resp.events[1].args.pack;

            expect(pack.length).to.equal(packSize);
            
            await assertUserIsCardOwner(album, user.address, pack);
            await assertProperFeesAndFeePools(album, packPrice, creatorFees);
        })

        it("Should draw the rare card if probability is 100%", async() => {
            
            const packSize = 5;
            const packPrice = ethers.utils.parseEther('5', 'ether');

            const { album, dev } = await loadFixture(albumContractFixture);

            const tx = await album.openPack(dev.address, packSize, {value: packPrice});
            const resp = await tx.wait();

            const packOpenedEvent = resp.events[1];
            const rareCardDrawnEvent = resp.events[0];

            expect(packOpenedEvent.event).to.equal(PACK_OPENED_EVENT);
            expect(rareCardDrawnEvent.event).to.equal(RARE_CARD_DRAWN_EVENT)
            
            const commonCardsDrawn = packOpenedEvent.args.pack;
            const rareCardId = rareCardDrawnEvent.args.cardId;

            await assertUserIsCardOwner(album, dev.address, [...commonCardsDrawn, rareCardId]);
            await assertProperFeesAndFeePools(album, packPrice, creatorFees);
        });
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