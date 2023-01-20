//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "./IRandomProvider.sol";

contract RandomProviderProxy is IRandomProvider {

    IRandomProvider r;
    address owner;

    constructor(IRandomProvider _r, address _owner) {
        _r = r;
        owner = _owner;
    }

    modifier _onlyOwner() {
        require(owner == msg.sender, "Not allowed");
        _;
    }

    function randSingle(uint len) external view returns (uint) {
        return r.randSingle(len);
    }

    function randRange(uint range, uint len) external view returns (uint[] memory) {
        return r.randRange(range, len);
    }

    function update(IRandomProvider _r) _onlyOwner() external {
        r = _r;
    }

    function transferOwnership(address _owner) _onlyOwner() external {
        owner = _owner;
    }
}