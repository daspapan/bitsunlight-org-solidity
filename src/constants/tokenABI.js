const tokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function owner() view returns (address)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function balanceOf(address account) view returns (uint256)",
  // Custom errors (OpenZeppelin v5) so reverts decode to readable names
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InvalidReceiver(address receiver)",
  "error OwnableUnauthorizedAccount(address account)",
];

module.exports = { tokenABI };
