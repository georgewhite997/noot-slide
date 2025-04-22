// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Ownable.sol";
import "./IERC20.sol";

contract Skins is Ownable {
    address public paymentToken;

    mapping(uint16 => uint256) public skinPrice;
    mapping(address => uint16[]) public userSkins;
    mapping(address => mapping(uint16 => bool)) private owns;

    event SkinPriceSet(uint16 indexed skinId, uint256 price);
    event SkinPurchased(address indexed buyer, uint16 indexed skinId, uint256 price);

    constructor(address _initialOwner, address _paymentToken) Ownable(_initialOwner) {
        paymentToken = _paymentToken;
    }

    function setPaymentToken(address token) external onlyOwner {
        paymentToken = token;
    }

    function setSkinPrice(uint16 skinId, uint256 price) external onlyOwner {
        skinPrice[skinId] = price;
        emit SkinPriceSet(skinId, price);
    }

    function purchase(uint16 skinId) external {
        uint256 price = skinPrice[skinId];
        require(price != 0, "Skin not for sale");
        require(!owns[msg.sender][skinId], "Already owned");
        require(IERC20(paymentToken).transferFrom(msg.sender, address(this), price), "Token transfer failed");

        owns[msg.sender][skinId] = true;
        userSkins[msg.sender].push(skinId);
        emit SkinPurchased(msg.sender, skinId, price);
    }

    function hasSkin(address user, uint16 skinId) external view returns (bool) {
        return owns[user][skinId];
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(msg.sender).call{value: bal}("");
        require(ok, "Transfer failed");
    }

    function withdrawERC20(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(IERC20(token).transfer(msg.sender, bal), "Withdraw failed");
    }

    receive() external payable {}
    fallback() external payable {}
}
