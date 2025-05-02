// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./Ownable.sol";
import "./IERC20.sol";
contract Registry is Ownable {
    mapping(address => bool) public registeredAddresses;

    uint256 public registrationFee = 0.0028 ether;

    event Registered(address indexed registeredAddress);

    constructor(address _owner) Ownable(_owner) {}

    function register() public payable {
        require(msg.value >= registrationFee, "Invalid registration fee");
        registeredAddresses[msg.sender] = true;
        emit Registered(msg.sender);
    }

    function setRegistrationFee(uint256 _registrationFee) public onlyOwner {
        registrationFee = _registrationFee;
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(msg.sender).call{value: bal}("");
        require(ok, "Transfer failed");
    }

    function withdrawERC20(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(IERC20(token).transfer(msg.sender, bal), "Transfer failed");
    }

    receive() external payable {}
    fallback() external payable {}
}
