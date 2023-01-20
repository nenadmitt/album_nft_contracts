const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
    RANDOM_PROVIDER_CONTRACT,
    REGISTAR_CONTRACT,
    ALBUM_CONTRACT,
    generateAlbumItems
} = require("./utils");

describe("AlbumRegistar", () => {

    let commonCards = generateAlbumItems(150);
    let rareCards = generateAlbumItems(10);
    let registarFees = 20;
    let minPackSize = 3;
    let maxPackSize = 6;
    let pricePerCard = 0;
    let initialFees = 20;
    let rareCardChance = 10;

    const albumRegistarFixture = async () => {

        const [account01, account02] = await ethers.getSigners();
        const AlbumRegistar = await ethers.getContractFactory(REGISTAR_CONTRACT);
        const registar = await AlbumRegistar.deploy(account01.address, registarFees);
        await registar.deployed();

        const RandomProvider = await ethers.getContractFactory(RANDOM_PROVIDER_CONTRACT);
        const randomProvider = await RandomProvider.deploy();
        await randomProvider.deployed();

        const albumItems = [];
        for (var i = 0; i < 30; i++) {
            albumItems.push({ id: i + 1, name: `Name#${i + 1}` })
        }

        const Album = await ethers.getContractFactory(ALBUM_CONTRACT);
        const album = await Album.deploy(
            commonCards,
            rareCards,
            account02.address,
            minPackSize,
            maxPackSize,
            pricePerCard,
            initialFees,
            rareCardChance,
            randomProvider.address,
            account02.address
        );
        await album.deployed();

        return {registar, album, creator: account02.address, owner: account01.address};
    }

    describe("Deployment", () => {
        it("Should deploy registar and set proper fees and owner", async () => {

            const [account01] = await ethers.getSigners();
            registarFees = 20;

            const {registar} = await loadFixture(albumRegistarFixture);
            const fee = await registar.fees();
            const owner = await registar.owner();

            expect(fee.toNumber()).to.equal(registarFees);
            expect(owner).to.equal(account01.address);
        })
    })

    describe("Album registration", () => {

        it("Should register an album", async () => {

            // minPackSize = 3;
            // maxPackSize = 6;
            // pricePerCard = ethers.utils.parseUnits('0.01', 'ether');
            // initialFees = 20;

            // const { album, creator, registar } = await loadFixture(albumRegistarFixture);

            // const _creator = await album.creator();

            // const tx = await registar.register(album.address, creator)
            // const resp1 = await tx.wait();

            // console.log(resp1.events[0].event, "RESP 1")

            // const [account1,account2,account3] = await ethers.getSigners();

            // const tx1 = await registar.connect(account3).openPack(album.address, account3.address, 6, { value: ethers.utils.parseUnits("1", 'ether')});
            // const resp = await tx1.wait();

            // const albumPackOpenedEvent = resp.events[1];
            // const {drawnCards, album: albumAddr, by} = albumPackOpenedEvent.args;

            // console.log(drawnCards)
            // console.log(drawnCards.length)

            // const cardMap = {};
            // for (let i = 0; i < drawnCards.length; i++) {
            //     const currentCard = drawnCards[i].toNumber();
            //     if (!cardMap[currentCard]) {
            //         cardMap[currentCard] = 1;
            //     }else {
            //         cardMap[currentCard] = cardMap[currentCard] + 1;
            //     }
            // }

            // for (let i = 0; i < drawnCards.length; i++) {
            //     const drawnCard = drawnCards[i].toNumber();
            //     const ownedCardsCount = await album.ownedCardsCount(account3.address, drawnCard);
            //     expect(ownedCardsCount.toNumber()).to.equal(cardMap[drawnCard], "After first pack gets opened, account should have one of each cards");
            // }
        })

        it("should remove registered album if album creator or registar controller", () => {

        })
    })
    describe("Album Iteraction", () => {
        it("should be able to open a pack of cards", () => {

        })
    })

    describe("Registrar fees", () => {
        it("should be able to withdraw contract fees", () => {

        })

        it("should be able to change fee ammount", () => {

        })
    })
})