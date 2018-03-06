//Remittance unit tests
Promise = require("bluebird");
var Remittance = artifacts.require("./Remittance.sol");

web3.eth.expectedException = require("../utils/expectedException.js");
//const sequentialPromise = require("../utils/sequentialPromise.js");
//web3.eth.makeSureHasAtLeast = require("../utils/makeSureHasAtLeast.js");
//web3.eth.makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

contract('Remittance', function(accounts) {

  var owner = accounts[0];
  var remitter = accounts[1];
  var remittee = accounts[2];
  var remittee2 = accounts[3];
  var amount = 500000;
  var blockDuration = 5;
  var remitFee =  100000;
  var pass = "abc";
  var pass2 = "def";
  var pass32bytes = "0x6162630000000000000000000000000000000000000000000000000000000000";
  var hashOfABC = "0x9b8075e3114a237714bcee811cbb0337de6d1423cb2947266772aae5963ec8e5"
  var pass1H = web3.sha3(web3.toHex("abc"), {encode: 'hex'});

  beforeEach(function() {
    return Remittance.new(remitFee, {from: owner})
    .then(function(instance) {
      contractInstance = instance;

    });
  });

  it("Should be owned by owner", function() {
    return contractInstance.owner.call({from: owner})
    .then(result => {
      assert.equal(result, owner, "owner did not return correctly");
    });
    //end test
  });
/*
  it("Should return the remit fee", function() {
    return contractInstance.remitFee.call({from: owner})
    .then(result => {
      //console.log("Remit Fee: " + result);
      assert.equal(result.valueOf(), remitFee, "Contract did not return the correct remit fee");
    });
    //end test
  });

  it("Should be able to change the remitFee", function() {
    var remitFee2 = 5000000;
    return contractInstance.changeRemitFee(remitFee2, {from: owner})
    .then(result => {
      assert.equal(result.receipt.status, true, "changeRemitFee did not return true");
      return contractInstance.remitFee.call({from: owner});
    })
    .then(result => {
      assert.equal(result, remitFee2, "remitFee did not return to changed value");
    });
    //end test
  });

  //test hashPasswords
  it("Should hash two passwords", function() {
    //var hashed1 = web3.sha3(pass1, {encoding: 'hex'});
    //var hashed2 = web3.sha3(pass2);
    //var hashed = web3.sha3(hashed1, hashed2);
    return contractInstance.hashPasswords.call(remitter, pass, {from: owner})
    .then(result => {
      //console.log("Result: " + result);
      assert.equal(result, result, "hashPasswords did not return correctly");
    });
    //end test
  });

  it("Should set passwords, address, and duration", function() {
    var blockNumber;
    var eExpirationBlock;
    var hashedReturn;
    var remitAmount;

    return contractInstance.hashPasswords.call(remitter, pass, {from: owner})
    .then(result => {
      hashedReturn = result;
      assert.isTrue(result > 0, "hashed did not return correctly");
      return contractInstance.setPass(remittee, result, blockDuration, {from: owner, value: amount})
      .then(result => {
        assert.equal(result.receipt.status, true, "setPass did not return true");
        assert.equal(result.logs[0].args.eRemittee, remittee, "LogSetRemittance did not return the remit address correctly");
        assert.equal(result.logs[0].args.eAmount, amount - remitFee, "LogSetRemittance did not return amount correctly");
        assert.equal(result.logs[0].args.eFee, remitFee, "LogSetRemittance did not return amount correctly");

        eExpirationBlock = result.logs[0].args.eExpirationBlock;
        remitAmount = amount - result.logs[0].args.eFee;

        return new Promise((resolve, reject) => {
          web3.eth.getBlockNumber((err, block) => {
            if (err) reject(err)
            else resolve(block)
          });
        });
      })
      .then(block => {
        blockNumber = block;
        assert.equal(blockNumber + blockDuration, eExpirationBlock, "LogSetRemittance did not return eExpirationBlock correctly");
        return contractInstance.remittees.call(remittee, {from: owner});
      })
      .then(result => {
        //console.log("Remitters: " + result[0]);
        assert.equal(result[0], hashedReturn, "hashedPassword did not return correctly");
        assert.equal(result[1], blockDuration + blockNumber, "expirationblock did not return correctly");
        assert.equal(result[2], remitAmount, "remitAmount did not return correctly");
        return contractInstance.getBalance.call({from: owner});
      })
      .then(result => {
        assert.equal(result.valueOf(), remitAmount + remitFee, "Contract balance did not return correctly");
      });
    });
    //end test
  });

  it("Should set two remittees and one remitter", function() {
    var blockNumber;
    var eExpirationBlock;
    var hashedReturn;
    var hashedReturn2;

    return contractInstance.hashPasswords.call(remitter, pass, {from: owner})
    .then(result => {
      hashedReturn = result;
      return contractInstance.setPass(remittee, result, blockDuration, {from: owner, value: amount})
      .then(result => {
        assert.equal(result.receipt.status, true, "setPass did not return true");
        return contractInstance.hashPasswords.call(remitter, pass2, {from: owner});
      })
      .then(result => {
        hashedReturn2 = result;
        return contractInstance.setPass(remittee2, result, blockDuration, {from: owner, value: amount})
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "2nd setPass did not return true");

        eExpirationBlock = result.logs[0].args.eExpirationBlock;

        return new Promise((resolve, reject) => {
          web3.eth.getBlockNumber((err, block) => {
            if (err) reject(err)
            else resolve(block)
          });
        });
      })
      .then(block => {
        blockNumber = block;
        assert.equal(blockNumber + blockDuration, eExpirationBlock, "LogSetRemittance did not return eExpirationBlock correctly");
        return contractInstance.remittees.call(remittee2, {from: owner});
      })
      .then(result => {
        //console.log("Remitters: " + result[0]);
        assert.equal(result[0], hashedReturn2, "hashedPassword did not return correctly");
        assert.equal(result[1], blockDuration + blockNumber, "expirationblock did not return correctly");
        assert.equal(result[2], amount - remitFee, "remitAmount did not return correctly");
        return contractInstance.getBalance.call({from: owner});
      })
      .then(result => {
        assert.equal(result.valueOf(), amount * 2, "Contract balance did not return correctly");
        return contractInstance.feeBalance.call({from: owner});
      })
      .then(result => {
        assert.equal(result.valueOf(), remitFee * 2, "Contract balance did not return correctly");
      });
    });
    //end test
  });

  it("Should be able to withdraw", function() {
    var balanceBefore;
    var balanceNow;
    var amountToSend;

    return contractInstance.hashPasswords.call(remitter, pass, {from: owner})
    .then(result => {
      return contractInstance.setPass(remittee, result, blockDuration, {from: owner, value: amount})
      .then(result => {
        assert.equal(result.receipt.status, true, "setPass did not return true");
        return contractInstance.hashPasswords.call(remitter, pass2, {from: owner});
      })
      .then(result => {
        return contractInstance.setPass(remittee2, result, blockDuration, {from: owner, value: amount})
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "2nd setPass did not return true");
        return contractInstance.getBalance.call({from: owner});
      })
      .then(result => {
        balanceBefore = result.valueOf();
        return contractInstance.withdrawFunds(remittee, pass, {from: remitter});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "withdraw did not return true");
        assert.equal(result.logs[0].args.eSender, remitter, "LogWithdraw did not return sender correctly");
        assert.equal(result.logs[0].args.eRemittee, remittee, "LogWithdraw did not return remittee correctly");
        assert.equal(result.logs[0].args.eAmount, amount - remitFee, "LogWithdraw did not return amount correctly");

        amountToSend = result.logs[0].args.eAmount;
        return contractInstance.getBalance.call({from: owner});
      })
      .then(result => {
        balanceNow = result.valueOf();
        assert.equal(balanceNow, balanceBefore - amountToSend, "balance did not return correctly");
        return contractInstance.feeBalance.call({from: owner});
      })
      .then(result => {
        assert.equal(result.valueOf(), remitFee * 2, "fee balance did not return correctly");
      });
    });
    //end test
  });

  it("Should withdraw the remittance fee", function() {
    var balanceBefore;
    var balanceNow;
    var feeBalanceBefore;
    var feeBalanceNow;

    return contractInstance.hashPasswords.call(remitter, pass, {from: owner})
    .then(result => {
      return contractInstance.setPass(remittee, result, blockDuration, {from: owner, value: amount})
      .then(result => {
        assert.equal(result.receipt.status, true, "setPass did not return true");
        return contractInstance.hashPasswords.call(remitter, pass2, {from: owner});
      })
      .then(result => {
        return contractInstance.setPass(remittee2, result, blockDuration, {from: owner, value: amount})
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "2nd setPass did not return true");
        return contractInstance.getBalance.call({from: owner});
      })
      .then(result => {
        balanceBefore = result.valueOf();
        return contractInstance.feeBalance.call({from: owner});
      })
      .then(result => {
        feeBalanceBefore =result.valueOf();
        return contractInstance.feeWithdraw({from: owner});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "feeWithdraw did not return ture");
        assert.equal(result.logs[0].args.eSender, owner, "LogFeeWithdraw did not return sender correctly");
        assert.equal(result.logs[0].args.eAmount, (remitFee * 2), "LogFeeWithdraw did not return amount correctly");
        return contractInstance.getBalance.call({from: owner});
      })
      .then(result => {
        balanceNow = result.valueOf();
        return contractInstance.feeBalance.call({from: owner});
      })
      .then(result => {
        feeBalanceNow = result.valueOf();
        assert.equal(balanceNow, balanceBefore - (remitFee * 2), "contract balance did not return correctly");
        assert.equal(feeBalanceNow, feeBalanceBefore - (remitFee * 2), "fee balance did not return correctly");
      });
    });
    //end test
  });

  it("Should refund from contract", function() {
    var shortBlockDuration = 1;
    var expirationBlock;
    var balanceBefore;
    var balanceEnding;
    var amountToSend;
    var amountToSend2;

    return contractInstance.hashPasswords.call(remitter, pass, {from: owner})
    .then(result => {
      return contractInstance.setPass(remittee, result, shortBlockDuration, {from: owner, value: amount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "setPass did not return true");
      return contractInstance.hashPasswords.call(remitter, pass2, {from: owner});
    })
    .then(result => {
      return contractInstance.setPass(remittee2, result, shortBlockDuration, {from: owner, value: amount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "2nd setPass did not return true");
      //advance one block
      return new Promise((resolve, reject) => {
        web3.eth.sendTransaction({from: owner, to: remitter, value: 100}, (err, tx) => {
          if (err) reject(err)
          else resolve(tx)
        });
      });
    })
    .then(tx => {
      //can't assert here as only the tx hash is returned, and don't know what that would be
      console.log("dummy tx: " + tx);
      return contractInstance.remittees.call(remittee, {from: owner});
    })
    .then(result => {
      expirationBlock = result[1].valueOf();
      return new Promise((resolve, reject) => {
        web3.eth.getBlockNumber((err, block) => {
          if (err) reject(err)
          else resolve(block)
        });
      });
    })
    .then(blockNumber => {
      //console.log("BlockNumber: " + blockNumber + "\n" + "ExpirationBlock: " + expirationBlock);
      assert.isTrue(expirationBlock <= blockNumber, "Block number does not equal exiration block");
      return contractInstance.getBalance.call({from: owner});
    })
    .then(result => {
      balanceBefore = result.valueOf();
      return contractInstance.refund(remittee, {from: owner});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "refund did not return true");
      assert.equal(result.logs[0].args.eSender, owner, "LogRefund did not return sender correctly");
      assert.equal(result.logs[0].args.eRemittee, remittee, "LogRefund did not return sender correctly");
      assert.equal(result.logs[0].args.eAmount.valueOf(), amount - remitFee, "LogRefund did not return balance correctly");
      amountToSend = result.logs[0].args.eAmount;
      return contractInstance.getBalance.call({from: owner});
    })
    .then(result => {
      balanceEnding = result.valueOf();
      assert.equal(result.valueOf(), balanceBefore - amountToSend, "Balance did not reconcile correctly");
      return contractInstance.refund(remittee2, {from: owner});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "refund did not return true");
      assert.equal(result.logs[0].args.eSender, owner, "LogRefund did not return sender correctly");
      assert.equal(result.logs[0].args.eRemittee, remittee2, "LogRefund did not return sender correctly");
      assert.equal(result.logs[0].args.eAmount, amount - remitFee, "LogRefund did not return balance correctly");
      amountToSend2 = result.logs[0].args.eAmount;
      return contractInstance.getBalance.call({from: owner});
    })
    .then(result => {
      assert.equal(result.valueOf(), balanceEnding - amountToSend2, "Ending balance did not return correctly");
    });
    //end test
  });

  it("Should not let non-owner stop the contract", function() {

    return web3.eth.expectedException(
      () => contractInstance.runSwitch(0, {from: remitter}),
    3000000);
    //end test
  });

  //test fail cases
  it("Should not change remitFee if not owner", function() {
    var remitFee2 = 500000;

    return web3.eth.expectedException(
      () => contractInstance.changeRemitFee(5, {from: remitter, gas: 3000000}),
        3000000);
    //end test
  });

  it("Should not change remitFee if not running", function() {
    var remitFee2 = 500000;

    return contractInstance.runSwitch(0, {from: owner})
    .then(result => {
      assert.equal(result.receipt.status, true, "runSwitch did not return true");
      return web3.eth.expectedException(
        () => contractInstance.changeRemitFee(5, {from: owner}),
      3000000);
    });
    //end test
  });
*/
  //end tests
});
