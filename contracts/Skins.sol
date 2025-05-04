// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./Ownable.sol";
import "./IERC20.sol";

contract Skins is Ownable {
    address public paymentToken;

    mapping(uint256 => uint256) public skinPrice;
    mapping(address => mapping(uint256 => bool)) public ownedSkins;

    event SkinPurchased(
        address indexed buyer,
        uint256 indexed skinId,
        uint256 price
    );

    constructor(
        address _initialOwner,
        address _paymentToken
    ) Ownable(_initialOwner) {
        paymentToken = _paymentToken;
    }

    function setPaymentToken(address token) external onlyOwner {
        paymentToken = token;
    }

    function setSkinPrice(uint256 skinId, uint256 price) external onlyOwner {
        skinPrice[skinId] = price;
    }

    function purchase(uint256 skinId) external {
        uint256 price = skinPrice[skinId];
        require(price != 0, "Skin not for sale");
        require(!ownedSkins[msg.sender][skinId], "Skin already owned");
        require(
            IERC20(paymentToken).transferFrom(msg.sender, address(this), price),
            "Token transfer failed"
        );
        ownedSkins[msg.sender][skinId] = true;
        emit SkinPurchased(msg.sender, skinId, price);
    }

    function getOwnedSkins(
        address user,
        uint256[] calldata skinIds
    ) external view returns (bool[] memory) {
        bool[] memory result = new bool[](skinIds.length);
        for (uint256 i = 0; i < skinIds.length; i++) {
            result[i] = ownedSkins[user][skinIds[i]];
        }
        return result;
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
