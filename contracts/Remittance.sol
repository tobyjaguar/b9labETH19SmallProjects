//Note for this to set correctly
//hashed passes need to be Solidity hashes of bytes32, not strings
//keccak256(bytes32) != keccak256(string)
pragma solidity ^0.4.13;

import "./Stoppable.sol";


contract Remittance is Stoppable {

    uint256 public balance;
    uint256 public remitFee;
    uint256 public feeBalance;

    struct Remittee {
        bytes32 hashedPassword;
        uint256 expirationBlock;
        uint256 remitAmount;
    }

    mapping(address => Remittee) public remittees;

    event LogSetRemittance(address eRemittee, uint256 eExpirationBlock, uint256 eAmount, uint256 eFee);
    event LogWithdraw(address eSender, address eRemittee, uint256 eAmount);
    event LogFeeWithdraw(address eSender, uint256 eAmount);
    event LogRefund(address eSender, address eRemittee, uint256 eAmount);

    function Remittance(uint256 _remitFee)
    public
    {
        remitFee = _remitFee;
    }

    function getBalance()
    public
    constant
    returns (uint256 _balance)
    {
        return balance;
    }

    function changeRemitFee(uint256 _remitFee)
    public
    onlyOwner
    onlyIfRunning
    returns (bool success)
    {
        remitFee = _remitFee;
        return true;
    }

    function hashPasswords(address _remitter, bytes32 _unhashedPassword)
    public
    constant
    returns (bytes32 hashedOutput)
    {
        return keccak256(_remitter, _unhashedPassword);
    }

    function setPass(address _remittee, bytes32 _hashedPassword, uint256 _duration)
    public
    payable
    onlyOwner
    onlyIfRunning
    returns (bool success)
    {
        require(msg.value > 0);
        require(_remittee != 0);
        require(_hashedPassword != 0);
        require(block.number < block.number + _duration);
        remittees[_remittee].hashedPassword = _hashedPassword;
        remittees[_remittee].expirationBlock = _duration + block.number;
        feeBalance += remitFee;
        remittees[_remittee].remitAmount += (msg.value - remitFee);
        balance += msg.value;

        LogSetRemittance(_remittee, remittees[_remittee].expirationBlock, remittees[_remittee].remitAmount, remitFee);
        return true;
    }

    function withdrawFunds(address _remittee, bytes32 _unhashedPassword)
    public
    onlyIfRunning
    returns(bool success)
    {
        require(msg.sender != 0);
        require(remittees[_remittee].remitAmount > 0);
        require(block.number < remittees[_remittee].expirationBlock);
        require(remittees[_remittee].hashedPassword == hashPasswords(msg.sender, _unhashedPassword));
        uint256 amountToSend;
        amountToSend = remittees[_remittee].remitAmount;
        remittees[_remittee].remitAmount = 0;
        msg.sender.transfer(amountToSend);
        balance -= amountToSend;

        LogWithdraw(msg.sender, _remittee, amountToSend);
        return true;
    }

    function feeWithdraw()
    public
    onlyOwner
    onlyIfRunning
    returns (bool success)
    {
        uint256 amountToSend;
        amountToSend = feeBalance;
        feeBalance = 0;
        balance -= amountToSend;
        owner.transfer(amountToSend);

        LogFeeWithdraw(msg.sender, amountToSend);
        return true;
    }

    function refund(address _remittee)
    public
    onlyOwner
    onlyIfRunning
    returns(bool success)
    {
        require(remittees[_remittee].remitAmount > 0);
        require(remittees[_remittee].expirationBlock <= block.number);
        uint256 amountToSend;
        amountToSend = remittees[_remittee].remitAmount;
        remittees[_remittee].remitAmount = 0;
        balance -= amountToSend;
        owner.transfer(amountToSend);

        LogRefund(msg.sender, _remittee, amountToSend);
        return true;
    }

}
