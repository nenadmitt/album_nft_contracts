//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "hardhat/console.sol";

interface IRandomProvider {
    
    function rand(uint range, uint len) external view returns (uint[] memory); 
}