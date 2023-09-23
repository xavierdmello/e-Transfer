// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint256 private version = 1;

    constructor() ERC20("USDC", "USDC") {}

    function mint(address account, uint amount) public {
        _mint(account, amount);
    }
}
