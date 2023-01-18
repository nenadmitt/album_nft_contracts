const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("SampleAlbum", () => {

    let albumItems = [];
    let packSize = 5;
    let packPrice = ethers.utils.parseUnits('0.1', 'ether');

    async function albumContractFixture() {

        const [owner, otherAccount] = await ethers.getSigners();

        const RandProvider = await ethers.getContractFactory("RandomProvider");
        const rand = await RandProvider.deploy();
        await rand.deployed();

        const SampleAlbum = await ethers.getContractFactory("SampleAlbum");
        const sampleAlbum = await SampleAlbum.deploy(
            albumItems,
            owner.address,
            packSize,
            packPrice,
            rand.address
        )
        await sampleAlbum.deployed();

        return { sampleAlbum, owner, rand };
    }

    describe("Functionality", () => {

        it("should open pack of packSize number and asign them to owner", async () => {

           const _albumItems = [];
           for (var i = 0; i < 100; i++) {
            _albumItems.push({id: i + 1, name:`Name#${i + 1}`});
           }
           albumItems = _albumItems;
           packSize = 5;
           packPrice = ethers.utils.parseUnits('0.000001','ether');
        
           const { sampleAlbum, owner, rand } = await loadFixture(albumContractFixture);

        //    const drawResponse = await sampleAlbum.openPack(owner.address, {value: packPrice});

           await expect(sampleAlbum.openPack(owner.address, {value: packPrice })).to.changeEtherBalances(
                      [owner, sampleAlbum],
                      [-packPrice.toNumber(), packPrice.toNumber()]
                    );

           let resp1 = await sampleAlbum.openPack(owner.address, {value: packPrice });       
           resp1 = await resp1.wait();
           console.log(resp1.events.length);
           console.log(resp1.events[0]);
        }) 
    })

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