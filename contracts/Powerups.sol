pragma solidity ^0.8.20;

import "./Ownable.sol";
import "./IERC20.sol";

contract Powerups is Ownable {
    mapping(address => mapping(uint16 => uint256)) public powerupsOwned;
    mapping(uint16 => uint256) public powerupPricing;

    event PowerupsPurchased(address indexed buyer, uint16[] powerupIds, uint256[] quantities);

    constructor(address _owner) Ownable(_owner) {}

    function setPowerupPrice(uint16 _powerupId, uint256 _price) public onlyOwner {
        powerupPricing[_powerupId] = _price;
    }

    function purchasePowerups(uint16[] calldata _powerupIds, uint256[] calldata _quantities) public payable {
        require(_powerupIds.length > 0, "No powerups specified");
        require(_powerupIds.length == _quantities.length, "Mismatched arrays");

        uint256 totalCost = 0;
        mapping(uint16 => uint256) storage userPowerups = powerupsOwned[msg.sender];
        for (uint256 i = 0; i < _powerupIds.length; i++) {
            uint16 powerupId = _powerupIds[i];
            uint256 quantity = _quantities[i];
            uint256 price = powerupPricing[powerupId];
            require(price > 0, "Powerup not available");
            totalCost += price * quantity;
            userPowerups[powerupId] += quantity;
        }

        require(msg.value >= totalCost, "Insufficient payment");

        emit PowerupsPurchased(msg.sender, _powerupIds, _quantities);
    }

    function getOwnedPowerups(address _user, uint16[] calldata ids) public view returns (uint256[] memory quantities) {
        quantities = new uint256[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            quantities[i] = powerupsOwned[_user][ids[i]];
        }
        return quantities;
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(msg.sender).call{value: bal}("");
        require(ok, "Transfer failed");
    }

    function usePowerup(uint16 _powerupId, uint256 _quantity) public {
        require(powerupsOwned[msg.sender][_powerupId] >= _quantity, "Not enough powerup to use");

        powerupsOwned[msg.sender][_powerupId] -= _quantity;
    }

    function withdrawERC20(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(IERC20(token).transfer(msg.sender, bal), "Transfer failed");
    }

    receive() external payable {}
    fallback() external payable {}
}