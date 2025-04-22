pragma solidity ^0.8.20;

contract Powerups_test {
    mapping(address => mapping(uint16 => uint256)) public powerupsOwned;

    function purchasePowerups(uint16[] calldata _powerupIds, uint256[] calldata _quantities) public payable {
        for (uint256 i = 0; i < _powerupIds.length; i++) {
           powerupsOwned[msg.sender][_powerupIds[i]] += _quantities[i];
        }
    }

    function getOwnedPowerups(address _user, uint16[] calldata ids) public view returns (uint256[] memory quantities) {
        quantities = new uint256[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            quantities[i] = powerupsOwned[_user][ids[i]];
        }
        return quantities;
    }

    
    function usePowerup(uint16 _powerupId, uint256 _quantity) public {
        require(powerupsOwned[msg.sender][_powerupId] >= _quantity, "Not enough powerup to use");

        powerupsOwned[msg.sender][_powerupId] -= _quantity;
    }
}