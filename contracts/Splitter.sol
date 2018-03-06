//Splitter
//there are 3 people: Alice, Bob and Carol
//we can see the balance of the Splitter contract on the web page
//whenever Alice sends ether to the contract, half of it goes to Bob and the other half to Carol
//we can see the balances of Alice, Bob and Carol on the web page
//we can send ether to it from the web page

pragma solidity ^0.4.13;

import "./Stoppable.sol";


contract Splitter is Stoppable {

    mapping(address => uint256) public splitAmounts;

    event LogSplitMembers(address eSender, address eSplit1, address eSplit2, uint256 eSplitAmount);
    event LogRequestWithdraw(address eRecipient, uint256 eAmount);

    function Splitter()
    public {
        //owner = msg.sender;
    }

    function splitMembers(address _split1, address _split2)
    public
    onlyIfRunning
    payable
    returns(bool success)
    {
        require(msg.sender != 0);
        require(msg.value > 0);
        require(_split1 != 0);
        require(_split2 != 0);
        require(msg.value%2 == 0);

        splitAmounts[_split1] += msg.value/2;

        splitAmounts[_split2] += msg.value/2;

        LogSplitMembers(msg.sender, _split1, _split2, msg.value/2);
        return true;
    }

    function requestWithdraw()
    public
    onlyIfRunning
    returns(bool success)
    {
        uint256 amountToSend = splitAmounts[msg.sender];
        require(amountToSend != 0);
        splitAmounts[msg.sender] = 0;
        msg.sender.transfer(amountToSend);

        LogRequestWithdraw(msg.sender, amountToSend);
        return true;
    }

}
