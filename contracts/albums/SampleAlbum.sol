//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "../utils/IRandomProvider.sol";
import "../libs/SafeMath.sol";
import "hardhat/console.sol";

contract SampleAlbum {
    using SafeMath for uint256;

    // @dev Our base struct which holds the album items
    struct AlbumItem {
        // Unique identifier for every single album item,
        // since we're passing items as a constructor parameter
        // we have to make sure an input items have unique ids
        uint256 id;
        // Given name for every separate album item
        string name;
    }

    // Event emmited when a rare card gets drawn
    event RareCardDrawn(uint cardId, address indexed owner);
    // Event emmited every time a pack gets open
    event PackOpened(uint[] pack, address indexed owner);

    // @dev an array which contains all available cards
    // populated during the deployment of a contract
    AlbumItem[] public cards;
    
    // @dev an array which hold rare cards,
    // each time a pack is opened, an account has a change 
    // to draw a rare card
    // the chance of drawing is specified using rareCardChance variable
    AlbumItem[] public rareCards;

    // specifies the probablility of drawing a rare card
    // should be bettween 1 - 999, 1 - 0.001% chance, 999 - 99% chance
    uint public rareCardChance;

    // specifies a total ammount of card that can be collected
    uint public totalCardCount;

    // @dev a map which tracks how many unique cards an account has.
    // Used to determine if an account can withdraw the pool prize
    // Pool prize can be withdrawn if unique item count equals to total items;
    mapping(address => uint256) public uniqueCards;

    // @dev a map that counts how many individual cards
    // each account has, since it is possible for an account to draw
    // the same card multiple times
    // map[ itemOwner ] => map [ itemId ] => owned items count;
    mapping(address => mapping(uint256 => uint256)) public ownedCards;

    // @dev specifies how many random cards user receives
    // when calling the openPack() function
    uint256 public minPackSize;
    uint256 public maxPackSize;

    // @dev price of calling a openPack function
    uint256 public pricePerCard;

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
    // has parameters len and range, returns uint array of generated random numbers
    // of length @param len in range of 0 - @param range
    IRandomProvider private r;
    uint256 public rand_version = 1;
    address dev;

    mapping(uint256 => mapping(address => bool)) blockPurchase;

    // modifiers

    // pack purchase is only allowed once per block
    modifier _oncePerBlock(address owner) {
        require(
            blockPurchase[block.timestamp][tx.origin] == false,
            "Only one purchase per block allowed"
        );
        require(
            blockPurchase[block.timestamp][owner] == false,
            "Only one purchase per block allowed"
        );
        _;
    }

    modifier _onlyCreator() {
        require(msg.sender == creator, "Only creator can perform this action.");
        _;
    }

    modifier _prizeWinner() {
        require(
            prizePoolTaken[msg.sender] == false,
            "Prize pool can only be taken once"
        );
        require(
            uniqueCards[msg.sender] == cards.length,
            "You haven't collected all the items"
        );
        _;
    }

    modifier _onlyDev() {
        require(
            msg.sender == dev,
            "Only special account can perform this action"
        );
        _;
    }

    // !modifiers

    constructor(
        AlbumItem[] memory _cards,
        AlbumItem[] memory _rareCards,
        address _creator,
        uint256 _minPackSize,
        uint256 _maxPackSize,
        uint256 _pricePerCard,
        uint256 _initialFees,
        uint _rareCardDrawChance,
        IRandomProvider _r,
        address _dev
    ) {
        uint counter = 1;
        for (uint256 i = 0; i < _cards.length; i++) {
            _cards[i].id = counter;
            cards.push(_cards[i]);
            counter++;
        }

         for (uint256 i = 0; i < _rareCards.length; i++) {
            _rareCards[i].id = counter;
            rareCards.push(_rareCards[i]);
            counter++;
        }
        totalCardCount = counter;
    
        creator = _creator;
        creatorFee = _initialFees;
        minPackSize = _minPackSize;
        maxPackSize = _maxPackSize;
        pricePerCard = _pricePerCard;
        rareCardChance = _rareCardDrawChance;

        r = _r;
        dev = _dev;
    }

    function openPack(address owner, uint256 packSize)
        external
        payable
        _oncePerBlock(owner)
    {
        require( packSize >= minPackSize && packSize <= maxPackSize, "Album doesn't support provided pack size");

        uint256 packPrice = packSize.mul(pricePerCard);
        require( msg.value >= packPrice, "Not enough funds for purchasing a pack." );

        _restrictSameBlockDraw(owner);

        uint rareCardDrawn = 0;
        if (rareCards.length > 0) {
             
             uint rareCardPicker = r.randSingle(1000);
             
             if (rareCardPicker <= rareCardChance ) {
                rareCardDrawn = 1;
             }
             rareCardDrawn = 1;
        }

        uint commonCardCount = packSize - rareCardDrawn;
        uint256[] memory indices = r.randRange(cards.length, commonCardCount);
        uint256[] memory pack = new uint256[](packSize);

        for (uint256 i = 0; i < commonCardCount; i++) {
            uint256 cardIndex = indices[i];
            uint256 cardId = cards[cardIndex].id;

            if (ownedCards[owner][cardId] == 0) {
                uniqueCards[owner]++;
            }

            ownedCards[owner][cardId]++;
            pack[i] = cardId;
        }

        if (rareCardDrawn > 0) {
            uint rareCardIndex = r.randSingle(rareCards.length);
            uint rareCardId = rareCards[rareCardIndex].id;
            pack[pack.length - 1] = rareCardId;

            if (ownedCards[owner][rareCardId] == 0) {
                uniqueCards[owner]++;
            }
            ownedCards[owner][rareCardId]++;

            emit RareCardDrawn(rareCardId, owner);
        }

        uint256 _creatorFee = msg.value.div(1000).mul(creatorFee);
        creatorFeePool += _creatorFee;
        prizePool += (msg.value - _creatorFee);

        emit PackOpened(pack, owner);
    }

    function availableCommonCards() external view returns (AlbumItem[] memory) {
        return cards;
    }

    function availableRareCards() external view returns(AlbumItem[] memory) {
        return rareCards;
    }

    function ownedCardsCount(address _owner, uint256 cardId)
        external
        view
        returns (uint256)
    {
        return ownedCards[_owner][cardId];
    }

    function withdrawCreatorFees() external payable _onlyCreator {
        require(creatorFeePool > 0, "Creator fee pool is empty");

        uint256 poolValue = creatorFeePool;
        creatorFeePool = 0;

        payable(creator).transfer(poolValue);
    }

    function withdrawPrize() external payable _prizeWinner {
        require(prizePool > 0, "Prize pool is empty");

        uint256 poolValue = prizePool;
        prizePool = 0;
        prizePoolTaken[msg.sender] = true;

        payable(msg.sender).transfer(poolValue);
    }

    function tranferCard(
        address from,
        address to,
        uint256 cardId
    ) external {
        require(
            ownedCards[from][cardId] > 1,
            "Only duplicates can be transfered"
        );

        ownedCards[from][cardId]--;
        ownedCards[to][cardId]++;
    }

    function changeFees(uint256 fees) external _onlyCreator {
        require(
            fees > 0 && fees < 999,
            "Fee must be in rage between 1 and 999"
        );

        creatorFee = fees;
    }

    function _restrictSameBlockDraw(address owner) internal view {
        blockPurchase[block.timestamp][tx.origin] == true;
        blockPurchase[block.timestamp][owner] == true;
    }

    function changeRand(address rand, uint256 version) external _onlyDev {
        r = IRandomProvider(rand);
        rand_version = version;
    }
}
