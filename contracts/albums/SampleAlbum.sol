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

    // Event emmited every time a pack gets open
    event PackOpened(uint256[] drawnCards, address indexed cardsOwner);

    // @dev an array which contains all available cards
    // populated during the deployment of a contract
    AlbumItem[] public cards;

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
        AlbumItem[] memory _items,
        address _creator,
        uint256 _minPackSize,
        uint256 _maxPackSize,
        uint256 _pricePerCard,
        uint256 _initialFees,
        IRandomProvider _r,
        address _dev
    ) {
        for (uint256 i = 0; i < _items.length; i++) {
            cards.push(_items[i]);
        }

        // cards = _items;

        creator = _creator;
        creatorFee = _initialFees;
        minPackSize = _minPackSize;
        maxPackSize = _maxPackSize;
        pricePerCard = _pricePerCard;

        r = _r;
        dev = _dev;
    }

    function openPack(address owner, uint256 packSize)
        external
        payable
        _oncePerBlock(owner)
        returns (uint256[] memory)
    {
        require(
            packSize >= minPackSize && packSize <= maxPackSize,
            "Album doesn't support provided pack size"
        );

        uint256 packPrice = packSize.mul(pricePerCard);
        require(
            msg.value >= packPrice,
            "Not enough funds for purchasing a pack."
        );

        _restrictSameBlockDraw(owner);

        uint256[] memory indices = r.rand(cards.length, packSize);
        uint256[] memory drawnItems = new uint256[](indices.length);

        for (uint256 i = 0; i < indices.length; i++) {
            uint256 cardIndex = indices[i];
            uint256 cardId = cards[cardIndex].id;

            if (ownedCards[owner][cardId] == 0) {
                uniqueCards[owner]++;
            }

            ownedCards[owner][cardId]++;
            drawnItems[i] = cardId;
        }

        uint256 _creatorFee = msg.value.div(1000).mul(creatorFee);
        creatorFeePool += _creatorFee;
        prizePool += (msg.value - _creatorFee);

        emit PackOpened(drawnItems, owner);

        return drawnItems;
    }

    function availableCards() external view returns (AlbumItem[] memory) {
        return cards;
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
