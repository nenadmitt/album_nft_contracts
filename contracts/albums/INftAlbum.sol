//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;


interface IAlbumController {
    function draw(address owner) payable external;
    function getPackSize() external returns (uint);
}

interface IAlbumRegistar {
    function ownsCard(address owner, uint cardId) external returns (uint);
    function getPackSize() external returns (uint);
}