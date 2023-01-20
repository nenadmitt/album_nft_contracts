//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

interface IAlbum {
     function openPack( address owner, uint packSize ) external payable returns (uint[] memory);
     function packOpenDuration() external returns (uint64);
     function withdrawCreatorFees() external payable;
     function withdrawPrizePool() external payable;
     function creator() external returns (address);
     function prizePool() external returns (uint256);
     function minPackSize() external returns (uint256);
     function maxPackSize() external returns (uint256);
     function pricePerCard() external returns (uint256);
}