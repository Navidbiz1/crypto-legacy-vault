// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSigVault {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;
    uint256 public transactionCount;
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }
    
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(uint256 => Transaction) public transactions;
    
    event Deposit(address indexed sender, uint256 amount);
    event Submission(uint256 indexed transactionId);
    event Confirmation(address indexed sender, uint256 indexed transactionId);
    event Execution(uint256 indexed transactionId);
    
    modifier validRequirement(uint256 ownerCount, uint256 _required) {
        require(_required > 0 && _required <= ownerCount && ownerCount > 0);
        _;
    }
    
    modifier onlyWallet() {
        require(msg.sender == address(this));
        _;
    }
    
    modifier ownerExists(address owner) {
        require(isOwner[owner]);
        _;
    }
    
    modifier confirmed(uint256 transactionId, address owner) {
        require(confirmations[transactionId][owner]);
        _;
    }
    
    modifier notExecuted(uint256 transactionId) {
        require(!transactions[transactionId].executed);
        _;
    }

    constructor(address[] memory _owners, uint256 _required) 
        validRequirement(_owners.length, _required) 
    {
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0));
            isOwner[_owners[i]] = true;
            owners.push(_owners[i]);
        }
        required = _required;
    }
    
    function submitTransaction(address destination, uint256 value, bytes memory data)
        external
        ownerExists(msg.sender)
        returns (uint256 transactionId)
    {
        transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            to: destination,
            value: value,
            data: data,
            executed: false
        });
        transactionCount += 1;
        emit Submission(transactionId);
        confirmTransaction(transactionId);
    }
    
    function confirmTransaction(uint256 transactionId)
        public
        ownerExists(msg.sender)
        notExecuted(transactionId)
    {
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }
    
    function executeTransaction(uint256 transactionId)
        public
        ownerExists(msg.sender)
        confirmed(transactionId, msg.sender)
        notExecuted(transactionId)
    {
        if (isConfirmed(transactionId)) {
            Transaction storage txn = transactions[transactionId];
            txn.executed = true;
            (bool success, ) = txn.to.call{value: txn.value}(txn.data);
            if (success) {
                emit Execution(transactionId);
            }
        }
    }
    
    function isConfirmed(uint256 transactionId) public view returns (bool) {
        uint256 count = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) count++;
            if (count >= required) return true;
        }
        return false;
    }
    
    function getOwners() external view returns (address[] memory) {
        return owners;
    }
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
