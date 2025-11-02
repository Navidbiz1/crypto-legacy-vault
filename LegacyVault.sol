// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LegacyVault {
    address public owner;
    address public heir;
    uint256 public lastActive;
    uint256 public constant TIMEOUT = 90 days;
    
    event InheritanceClaimed(address heir, uint256 amount);
    event ProofOfLife(address owner);
    
    constructor(address _heir) payable {
        owner = msg.sender;
        heir = _heir;
        lastActive = block.timestamp;
    }
    
    function proveAlive() external {
        require(msg.sender == owner, "Only owner");
        lastActive = block.timestamp;
        emit ProofOfLife(owner);
    }
    
    function claimInheritance() external {
        require(msg.sender == heir, "Only heir");
        require(block.timestamp > lastActive + TIMEOUT, "Timeout not reached");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        
        payable(heir).transfer(balance);
        emit InheritanceClaimed(heir, balance);
    }
    
    function getTimeLeft() external view returns (uint256) {
        if (block.timestamp <= lastActive + TIMEOUT) {
            return (lastActive + TIMEOUT) - block.timestamp;
        }
        return 0;
    }
    
    receive() external payable {}
}
