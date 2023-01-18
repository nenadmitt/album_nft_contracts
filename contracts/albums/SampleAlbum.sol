//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "./INftAlbum.sol";
import "../utils/IRandomProvider.sol";
import "hardhat/console.sol";

contract SampleAlbum {
   
   // @dev Our base struct which holds the album items
   struct AlbumItem {
     
     // Unique identifier for every single album item,
     // since we're passing items as a constructor parameter
     // we have to make sure an input items have unique ids
     uint id;
     
     // Given name for every separate album item
     string name;
   }

   // Event emmited every time a pack gets open
   event PackOpened (
     uint[] ids,
     address indexed owner
   );

   // @dev Structure which contains all available album item ids
   // Used when we perform a draw.
   // While drawing, we generate a random number ( range of 0 - itemIds.length)
   // which acts as an index of this array
   uint[] public itemIds;
   
   // specifies the total ammount of available items for collecting
   uint public totalItems;
   
   // @dev mapping which contains all available items
   // which can easily be looked up by an id of an item
   mapping(uint => AlbumItem) public itemIdToItem;
   
   // @dev a map which tracks how many unique cards an account has.
   // Used to determine if an account can withdraw the pool prize
   // Pool prize can be withdrawn if unique item count equals to total items;
   mapping(address => uint) public uniqueItems;

   // @dev a map that counts how many individual cards
   // each account has, since it is possible for an account to draw
   // the same card multiple times
   // map[ itemOwner ] => map [ itemId ] => owned items count;
   mapping(address => mapping(uint => uint)) ownedItems;

   // @dev specifies how many random cards user receives
   // when calling the openPack() function
   uint public packSize;

   // @dev price of calling a openPack function
   uint256 public packPrice;

   // @dev used for storing information about users who claimed the prize.
   // prize pool can only be claimed once
   mapping(address => bool) prizePoolTaken;

   // @dev 
   uint256 public prizePool;
   uint256 public creatorFeePool;
   uint256 public creatorFee;
   address public creator;

   // @dev provider responsible for generation of random numbers,
   // which is used when we perform draw();
   // the interface contains a single function rand(), which 
   // has parameters len and range, return int array of generated random numbers
   // of length @param len in range of 0 - @param range
   IRandomProvider r;

   mapping(uint256 => mapping(address => bool)) blockPurchase;
   
   // modifiers 

   // pack purchase is only allowed once per block
   modifier _oncePerBlock() {
      require(blockPurchase[block.timestamp][msg.sender] == false, "Only one purchase per block allowed");
      _;
   }

   modifier _onlyCreator() {
      require(msg.sender == creator, "Only creator can perform this action.");
      _;
   }

   modifier _prizeWinner() {
     require(prizePoolTaken[msg.sender]  == false, "Prize pool can only be taken once");
     require(uniqueItems[msg.sender] == totalItems, "You haven't collected all the items");
     _;
   }

   // !modifiers

   constructor(
    AlbumItem[] memory _items,
    address _creator,
    uint _packSize,
    uint _packPrice,
    IRandomProvider _r
   ) {

    console.log("deploying");

    //Populate and store every single album item 
    for (uint i = 0; i < _items.length; i++) {
        itemIdToItem[_items[i].id] = _items[i];
        itemIds.push(_items[i].id);
    }
    totalItems = _items.length;

    creator = _creator;
    packPrice = _packPrice;
    packSize = _packSize;
    r = _r;
   }

   function openPack(address owner) _oncePerBlock() external payable returns (uint[] memory) {

        require(msg.value >= packPrice, "Not enough funds for purchasing a pack.");
        
        blockPurchase[block.timestamp][msg.sender] = true;

        uint[] memory indices = r.rand(itemIds.length, packSize);
        uint[] memory drawnItems = new uint[](indices.length);
        
        for (uint i = 0; i < indices.length; i++) {
            
            uint itemIndex = indices[i];
            uint itemId = itemIds[itemIndex];
            
            if ( ownedItems[owner][itemId] == 0 ) {
                uniqueItems[owner]++;
            }

            ownedItems[owner][itemId]++;
            drawnItems[i] = itemId;

        }

        uint256 _creatorFee =  (msg.value / 100) * 40;
        creatorFeePool += _creatorFee;
        prizePool += msg.value - _creatorFee;

        emit PackOpened(drawnItems, owner);

        return drawnItems;
   }

   function withdrawCreatorFees() _onlyCreator() external payable {
         
         require(creatorFeePool > 0, "Creator fee pool is empty");

         uint256 poolValue = creatorFeePool;
         creatorFeePool = 0;

         payable(creator).transfer(poolValue);
   } 

   function withdrawPrize() _prizeWinner() external payable {
      
       require(prizePool > 0, "Prize pool is empty");

       uint poolValue = prizePool;
       prizePool = 0;
       prizePoolTaken[msg.sender] = true;

       payable(msg.sender).transfer(poolValue);
   }

}