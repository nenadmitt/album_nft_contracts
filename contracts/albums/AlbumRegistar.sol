//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "hardhat/console.sol";
import "./IAlbum.sol";

contract AlbumRegistar {

    event AlbumRegistered (address home, address indexed creator);

    event AlbumRemoved(address home, address removedBy);

    event AlbumPackOpened(address indexed album, uint[] drawnCards, address by);

    mapping(address => address) public registar;

    mapping(address => bool) controllers;

    address public owner;
    uint256 public fees;

    bool private paused;

    // modifiers
    modifier _notPaused() {
        require( paused == false, "Contract execution is paused" );
        _;
    }

    modifier _onlyController() {
        require(controllers[msg.sender] == true, "Only controller can perform this action");
        _;
    }

    modifier _onlyOwner() {
        require(owner == msg.sender, "Only owner can perform this action");
        _;
    }

    modifier _albumRegistered(address a) {
        require(registar[a] != address(0), "Album is not registered");
        _;
    }

    // !modifiers
    
    constructor(address _owner, uint _fees) {
        controllers[owner] = true;
        owner = _owner;
        fees = _fees;
    }

    function register( address albumAddress, address creator ) _notPaused() external {
        
        require(registar[albumAddress] == address(0), "Album already registered");

        IAlbum a = IAlbum(albumAddress);

        require(address(a.creator()) == creator, "Only album creator can register album");
        
        registar[albumAddress] = creator;

        emit AlbumRegistered(albumAddress, creator);
    }

    function ownerOf(address album) external view returns (address) {
        return registar[album];
    }

    function openPack(address album, address packOwner, uint packSize) _notPaused() _albumRegistered(album) external payable {
        
        require(registar[album] != address(0), "Album is not registered");

        IAlbum a = IAlbum(album);

        uint minPackSize = a.minPackSize();
        uint maxPackSize = a.maxPackSize();
        uint pricePerCard= a.pricePerCard();

        require(packSize >= minPackSize && packSize <= maxPackSize, "Unsupported pack size");

        uint256 packPrice = packSize * pricePerCard;
        uint256 registrarFees = (packPrice / 1000) * fees; 

        require (msg.value >= packPrice + registrarFees, "Insufficient ammount for purchasing a pack");

        uint[] memory drawnCards = a.openPack{value:packPrice}(packOwner, packSize);

        emit AlbumPackOpened(album, drawnCards, packOwner);
    }

    function removeRegistration(address albumAddr) _albumRegistered(albumAddr) external {
        
        bool ownerOrController = registar[albumAddr] == msg.sender || controllers[msg.sender];
        require(ownerOrController, "Album registration can only be removed by an owner or controller");

        delete registar[albumAddr];

        emit AlbumRemoved(albumAddr, msg.sender);
    }

    function changeFees(uint _fees) _onlyController external {
        require(_fees > 0 && _fees < 999, "Invalid fee value");
        fees = _fees;
    }

    function withdrawFees(address to) _onlyOwner external {
        require(address(this).balance > 0, "Not enough balance");
        payable(to).transfer(address(this).balance);
    }

    function togglePause() _onlyController external {
        paused = !paused;
    }

    function modifyController(address controller, bool remove) _onlyOwner external {
        
        if (remove) {
            require(controllers[controller], "Controller doesn't exist");
            delete controllers[controller];
        }else {
            controllers[controller] = true;
        }
        
    }
}