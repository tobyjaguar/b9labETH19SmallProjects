//Splitter Test File
Promise = require("bluebird");
var Splitter = artifacts.require("./Splitter.sol");
var BigNumber = require('bignumber.js');

web3.eth.expectedException = require("../utils/expectedException.js");
//const sequentialPromise = require("../utils/sequentialPromise.js");
//web3.eth.makeSureHasAtLeast = require("../utils/makeSureHasAtLeast.js");
//web3.eth.makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

contract('Splitter', function(accounts) {

  var owner = accounts[0];
  var sender2 = accounts[1]
  var receiver1 = accounts[2];
  var receiver2 = accounts[3];
  var receiver3 = accounts[4];

  var amount = web3.toWei(2, "ether");

  beforeEach(function() {
    return Splitter.new({ from: owner })
    .then(function(instance) {
      contractInstance = instance;

    });
  });

  //test owner
  it("Should be owned by owner", function() {
    return contractInstance.owner({from: owner})
    .then(result => {
      assert.equal(result, owner, "Contract is not owned by owner");
    });
  });

  //members should be set
  it("Should be able to split amount amount two members", function() {

    return contractInstance.splitMembers(receiver1, receiver2, {from: owner, value: amount})
    .then(result => {
      assert.equal(result.receipt.status, true, "splitMembers did not return true");
      return contractInstance.splitAmounts.call(receiver1, {from: owner});
    })
    .then(result => {
      //console.log("splitters: " + result[0] + "\n" + result[1]);
      assert.equal(result, (amount / 2), "splitters did not return amount correctly");
      return contractInstance.splitAmounts.call(receiver2, {from: owner});
    })
    .then(result => {
      assert.equal(result, amount / 2, "splitters did not return amount correctly");
    });
    //end test
  });

  describe("Check withdrawals", function() {

    beforeEach("Run the split", function() {
      return contractInstance.splitMembers(receiver1, receiver2, {from: owner, value: amount})
      .then( result => {
        assert.equal(result.receipt.status, true, "splitMembers did not return true");;
      });
    })

    it("Should withdraw first receipient's funds from the contract", function() {
      var hash;
      var gasPrice = 0;
      var gasUsed = 0;
      var txFee = 0;
      var sendAmount = 0;
      var balanceBefore;
      var balanceNow;

      return new Promise((resolve, reject) => {
        web3.eth.getBalance(receiver1, (err, balance) => {
          if (err) reject(err)
          else resolve(balance)
        });
      })
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.requestWithdraw({from: receiver1});
      })
      .then(txObj => {
        hash = txObj.receipt.transactionHash;
        gasUsed = txObj.receipt.gasUsed;
        return web3.eth.getTransactionPromise(hash);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        /*
        console.log(
          "gasPrice: " + gasPrice + "\n" +
          "gasUsed: " + gasUsed
        );
        */
        return web3.eth.getBalancePromise(receiver1);
      })
      .then(balance => {
        balanceNow = balance;
        sendAmount = amount/2;
        txFee = gasUsed * gasPrice;
        /*
        console.log(
          "Balance differnce: " + balanceNow.minus(balanceBefore) + "\n" +
          "Amount - fee: " + (sendAmount - txFee) + "\n" +
          "delta: " + balanceNow.minus(balanceBefore).plus(sendAmount).minus(txFee) + "\n" +
          "nuDelta: " + balanceBefore.minus(balanceNow).plus(sendAmount).minus(txFee)
        );
        */
        assert.equal(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee), "Receiver1's balance did not return correctly");
      });
      //end test
    });

    it("Should withdraw second receipient's funds from the contract", function() {
      var hash;
      var gasPrice = 0;
      var gasUsed = 0;
      var txFee = 0;
      var sendAmount = 0;
      var balanceBefore;
      var balanceNow;

      return web3.eth.getBalancePromise(receiver2)
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.requestWithdraw({from: receiver2});
      })
      .then(txObj => {
        hash = txObj.receipt.transactionHash;
        gasUsed = txObj.receipt.gasUsed;
        return web3.eth.getTransactionPromise(hash);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        return web3.eth.getBalancePromise(receiver2);
      })
      .then(balance => {
        balanceNow = balance;
        sendAmount = amount/2;
        txFee = gasUsed * gasPrice;
        assert.equal(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee).toString(10), "Receiver2's balance did not return correctly");
      });
      //end test
    });
    //end describe
  });

  it("Should split multiple members and withdraw multiple members", function() {
    var hash;
    var gasUsed = 0;
    var gasPrice = 0;
    var txFee = 0;
    var sendAmount = 0;
    var balanceBefore;
    var balanceNow;

    return contractInstance.splitMembers(receiver1, receiver2, {from: owner, value: amount})
    .then(result => {
      assert.equal(result.receipt.status, true, "splitMembers did not return true");
      return contractInstance.splitMembers(receiver2, receiver3, {from: owner, value: amount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "splitMembers did not return true");
      return web3.eth.getBalancePromise(receiver2);
    })
    .then(balance => {
      balanceBefore = balance;
      return contractInstance.requestWithdraw({from: receiver2});
    })
    .then(txObj => {
      hash = txObj.receipt.transactionHash;
      gasUsed = txObj.receipt.gasUsed;
      assert.equal(txObj.receipt.status, true, "withdraw did not return true");
      return web3.eth.getTransactionPromise(hash);
    })
    .then(tx => {
      gasPrice = tx.gasPrice;
      return web3.eth.getBalancePromise(receiver2);
    })
    .then(balance => {
      balanceNow = balance;
      txFee = gasUsed * gasPrice;
      sendAmount = (amount/2)*2;
      assert.equal(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee).toString(10), "Receiver2's balance did not return correctly");
    });
    //end test
  });

  it("Should not let non-owner stop the contract", function() {

    return web3.eth.expectedException(
      () => contractInstance.runSwitch(0, {from: sender2}),
    3000000);
    //end test
  });

  //test for failed cases
  it("Should not split among members if not running", function() {

    return contractInstance.runSwitch(0, {from: owner})
    .then(result => {
      assert.equal(result.receipt.status, true, "runSwitch did not return true");
      return contractInstance.running.call({from: owner})
    })
    .then(result => {
      assert.isFalse(result, "Running did not return false");
      return web3.eth.expectedException(
        () => contractInstance.splitMembers(receiver1, receiver2, {from: owner}),
        3000000);
    });
    //end test
  });

  it("Should not allow withdrawals when not running", function() {

    return contractInstance.splitMembers(receiver1, receiver2, {from: owner, value: amount})
    .then(result => {
      assert.equal(result.receipt.status, true, "splitMembers did not return true");
      return contractInstance.runSwitch(0, {from: owner});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "runSwitch did not return true");
      return web3.eth.expectedException(
        () => contractInstance.requestWithdraw({from: receiver1}),
      3000000);
    });
    //end test
  });

//end tests
});
