// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestToken
 * @notice Replace this stub with a working token. Keep the contract name TestToken.
 *
 * Required behavior (see test/TestToken.ts — do not change those tests):
 * - Name: TestToken
 * - Symbol: STT
 * - decimals(): 18
 * - Constructor mints 1000 tokens (1000 * 10**18) to the deployer
 * - mint(address to, uint256 amount) — owner only
 * - burn(uint256 amount) — caller burns from their own balance
 * - balanceOf(address account)
 * - owner() — deployer is the owner
 *
 * Use OpenZeppelin ERC20, ERC20Burnable, and Ownable.
 */

contract TestToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000 * 10 ** 18;

    constructor() ERC20("TestToken", "STT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @notice Mint `amount` base units to `to`. Only callable by the owner.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}