// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ETransfer {
    struct Transfer {
        bytes32 from;
        bytes32 to;
        address refundAddress;
        uint amount;
    }

    modifier onlyLinker() {
        require(msg.sender == linker, "Only linker can call this function.");
        _;
    }

    event TransferPending(
        bytes32 indexed from,
        bytes32 indexed to,
        uint amount
    );

    event TransferSent(
        bytes32 indexed from,
        bytes32 indexed to,
        uint amount,
        bool indexed autodeposit
    );

    event TransferCancelled(
        bytes32 indexed from,
        bytes32 indexed to,
        uint amount,
        Party indexed party
    );

    enum Party {
        SENDER,
        RECIPIENT
    }
    Transfer[] public pendingTransfers;
    mapping(address => bytes32) public linkedEmail; // Address => Email hash
    mapping(bytes32 => address) public autodepositAddress; // Email hash => bool
    address public linker;
    IERC20 public token;
    uint256 private version = 1;
    constructor(address _token) {
        linker = msg.sender;
        token = IERC20(_token);
    }

    function getPendingTransfers() external view returns (Transfer[] memory) {
        return pendingTransfers;
    }

    function setLinker(address newLinker) public /*onlyLinker*/ {
        linker = newLinker;
    }

    function linkAccount(
        bytes32 emailHash,
        address account
    ) public /*onlyLinker*/ {
        linkedEmail[account] = emailHash;
    }

    function sendTransfer(bytes32 to, uint amount) public {
        // Gas optimization - read storage value only once and store in memory
        address autodepositAddressMemory = autodepositAddress[to];

        if (autodepositAddressMemory != address(0)) {
            token.transferFrom(msg.sender, autodepositAddressMemory, amount);
            emit TransferSent(linkedEmail[msg.sender], to, amount, true);
        } else {
            token.transferFrom(msg.sender, address(this), amount);
            Transfer memory transfer = Transfer(
                linkedEmail[msg.sender],
                to,
                msg.sender,
                amount
            );
            pendingTransfers.push(transfer);
            emit TransferPending(transfer.from, transfer.to, transfer.amount);
        }
    }

    function receiveTransfer(
        uint pendingTransferIndex,
        address depositAddress
    ) public {
        Transfer memory transfer = pendingTransfers[pendingTransferIndex];
        require(
            transfer.to == linkedEmail[msg.sender],
            "You are not the recipient of this transfer."
        );

        // Delete transfer from pendingTransfers array
        pendingTransfers[pendingTransferIndex] = pendingTransfers[
            pendingTransfers.length - 1
        ];
        pendingTransfers.pop();

        token.transfer(depositAddress, transfer.amount);
        emit TransferSent(transfer.from, transfer.to, transfer.amount, false);
    }

    function setAutodepositAddress(address value) external {
        // gas optimization
        bytes32 linkedEmailMemory = linkedEmail[msg.sender];

        // require users to have a linked account
        require(
            linkedEmailMemory != bytes32(0),
            "You must have an etransfer account to change autodeposit settings."
        );

        autodepositAddress[linkedEmailMemory] = value;
    }

    function cancelTransfer(uint pendingTransferIndex) public {
        Transfer memory transfer = pendingTransfers[pendingTransferIndex];
        Party party;

        if (transfer.from == linkedEmail[msg.sender]) {
            party = Party.SENDER;
        } else if (transfer.to == linkedEmail[msg.sender]) {
            party = Party.RECIPIENT;
        } else {
            revert();
        }

        // Delete transfer from pendingTransfers array
        pendingTransfers[pendingTransferIndex] = pendingTransfers[
            pendingTransfers.length - 1
        ];
        pendingTransfers.pop();

        token.transfer(transfer.refundAddress, transfer.amount);
        emit TransferCancelled(
            transfer.from,
            transfer.to,
            transfer.amount,
            party
        );
    }
}
