//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "hardhat/console.sol";

interface IRandomProvider {
    
    function randSingle(uint len) external view returns (uint);
    function randRange(uint range, uint len) external view returns (uint[] memory);
}