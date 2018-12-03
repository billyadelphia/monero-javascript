const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");

/**
 * Runs common tests that any Monero wallet should implement.
 * 
 * @param wallet is the Monero wallet to test
 * @param daemon informs some tests
 */
function testWallet(wallet, daemon) {
  
  it("Can get the current height that the wallet is synchronized to", async function() {
    let height = await wallet.getHeight();
    assert(height >= 0);
  });
  
  it("Can get the mnemonic phrase derived from the seed", async function() {
    let mnemonic = await wallet.getMnemonic();
    MoneroUtils.validateMnemonic(mnemonic);
  });
  
  it("Can sync (without progress)", async function() {
    let numBlocks = 100;
    let chainHeight = await daemon.getHeight();
    assert(chainHeight >= numBlocks);
    let resp = await wallet.sync(chainHeight - numBlocks);  // sync end of chain
    assert(resp.blocks_fetched >= 0);
    assert(typeof resp.received_money === "boolean");
  });
  
  it("Can get a list of supported languages for the mnemonic phrase", async function() {
    let languages = await wallet.getLanguages();
    assert(Array.isArray(languages));
    assert(languages.length);
    for (let language of languages) assert(language);
  });
  
  it("Can get the private view key", async function() {
    let privateViewKey = await wallet.getPrivateViewKey()
    MoneroUtils.validatePrivateViewKey(privateViewKey);
  });
  
  it("Can get the primary address", async function() {
    let primaryAddress = await wallet.getPrimaryAddress();
    MoneroUtils.validateAddress(primaryAddress);
    assert.equal((await wallet.getSubaddress(0, 0)).getAddress(), primaryAddress);
  });
  
  it("Can get an integrated address given a payment id", async function() {
    let integratedAddress = await wallet.getIntegratedAddress("03284e41c342f036");
    let decodedAddress = await wallet.decodeIntegratedAddress(integratedAddress.toString());
    assert.deeqpEquals(integratedAddress, decodedAddress);
  });
  
  it("Can get all accounts in the wallet without subaddresses", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    accounts.map(account => {
      testAccount(account)
      assert(account.getSubaddresses() === undefined);
    });
  });
  
  it("Can get all accounts in the wallet with subaddresses", async function() {
    let accounts = await wallet.getAccounts(true);
    assert(accounts.length > 0);
    accounts.map(account => {
      testAccount(account);
      assert(account.getSubaddresses().length > 0);
      account.getSubaddresses().map(subaddress => testSubaddress(subaddress));
    });
  });
  
  it("Can get an account at a specified index", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    for (let account of accounts) {
      testAccount(retrieved);
      
      // test without subaddresses
      let retrieved = await wallet.getAccount(account.getIndex());
      assert(retrieved.getSubaddresses() === undefined);
      
      // test with subaddresses
      retrieved = await wallet.getAccount(account.getIndex(), true);
      assert(retrieved.getSubaddresses().length > 0);
    }
  });
  
  it("Can create a new account without a label", async function() {
    let accountsBefore = await wallet.getAccounts();
    let createdAccount = await wallet.createAccount();
    testAccount(createdAccount);
    assert(createdAccount.getLabel() === undefined);
    assert(accountsBefore.length === (await wallet.getAccounts().size()) - 1);
  });
  
  it("Can create a new account with a label", async function() {
    
    // create account with label
    let accountsBefore = await wallet.getAccounts();
    let label = GenUtils.uuidv4();
    let createdAccount = await wallet.createAccount(label);
    testAccount(createdAccount);
    assert(createdAccount.getLabel() === label);
    assert(accountsBefore.length === (await wallet.getAccounts().size()) - 1);

    // create account with same label
    createdAccount = await wallet.createAccount(label);
    testAccount(createdAccount);
    assert(createdAccount.getLabel() === label);
    assert(accountsBefore.length === (await wallet.getAccounts().size()) - 2);
  });
  
  it("Can get subaddresses at a specified account index", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    for (let account of accounts) {
      let subaddresses = await wallet.getSubaddresses(account.getIndex());
      assert(subaddresses.length > 0);
      subaddresses.map(subaddress => {
        testSubaddress(subaddress);
        assert(account.getIndex() === subaddress.getAccountIndex());
      });
    }
  });
  
  it("Can get subaddresses at specified account and subaddress indices", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    for (let account of accounts) {
      
      // get subaddresses
      let subaddresses = await wallet.getSubaddresses(account.getIndex());
      assert(subaddresses.length > 0);
      
      // remove a subaddress for query if possible
      if (subaddresses.length > 1) subaddresses.splice(0, 1);
      
      // get subaddress indices
      let subaddressIndices = subaddresses.map(subaddress => subaddress.getSubaddrIndex());
      console.log("JUST CHECKING");
      console.log(subaddressIndices);
      assert(subaddressIndices.length > 0);
      
      // fetch subaddresses by indices
      let fetchedSubaddresses = await wallet.getSubaddresses(account.getIndex(), subaddressIndices);
      
      // original subaddresses (minus one removed if applicable) is equal to fetched subaddresses
      assert.deeqEqual(subaddresses, fetchedSubaddresses);
    }
  });
  
  it("Can get a subaddress at a specified account and subaddress index", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    for (let account of accounts) {
      let subaddresses = await wallet.getSubaddresses(account.getIndex());
      assert(subaddresses.length > 0);
      for (let subaddress of subaddresses) {
        assert.deeqEqual(subaddress, await wallet.getSubaddress(account.getIndex(), subaddress.getSubaddrIndex()));
        assert.deeqEqual(subaddress, await wallet.getSubaddresses(account.getIndex(), subaddress.getSubaddrIndex())); // test plural call with single subaddr number
      }
    }
  });
  
  it("Can create a subaddress with and without a label", async function() {
    
    // create subaddresses across accounts
    let accounts = await wallet.getAccounts();
    if (accounts.length < 2) await wallet.createAccount();
    accounts = await wallet.getAccounts();
    assert(accounts.length > 1);
    for (let accountIdx = 0; accountIdx < 2; accountIdx++) {
      
      // create subaddress with no label
      let subaddresses = await wallet.getSubaddresses(accountIdx);
      let subaddress = await wallet.createSubaddress(accountIdx);
      assert.equal("", subaddress.getLabel());
      testSubaddress(subaddress);
      let subaddressesNew = await wallet.getSubaddresses(accountIdx);
      assert.equal(subaddresses.length, subaddressesNew.length - 1);
      assert.deepEqual(subaddress, subaddressesNew.get(subaddressesNew.size() - 1));
      
      // create subaddress with label
      subaddresses = await wallet.getSubaddresses(accountIdx);
      let uuid = GenUtils.uuidv4();
      subaddress = await wallet.createSubaddress(accountIdx, uuid);
      assert.equal(subaddress.getLabel(), uuid);
      testSubaddress(subaddress);
      subaddressesNew = await wallet.getSubaddresses(accountIdx);
      assert.equal(subaddresses.length, subaddressesNew.length - 1);
      assert.equals(subaddress, subaddressesNew.get(subaddressesNew.length - 1));
    }
  });
  
  it("Can get the address of a subaddress at a specified account and subaddress index", async function() {
    assert.equal(await wallet.getPrimaryAddress(), (await wallet.getSubaddress(0, 0)).getAddress());
    for (let account of await wallet.getAccounts(true)) {
      for (let subaddress of await wallet.getSubaddresses(account.getIndex())) {
        assert.equal(subaddress.getAddress(), await wallet.getAddress(account.getIndex(), subaddress.getSubaddrIndex()));
      }
    }
  });
  
  it("Can get the balance across all accounts", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the unlocked balance across all accounts", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get txs pertaining to the wallet", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get txs pertaining to an account", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get txs pertaining to a subaddress", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get txs filtered by having payments or not", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get wallet txs by id", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get wallet txs with a filter", async function() {
    throw new Error("Not implemented");
  });
  
  it("Has a balance that is the sum of all unspent incoming transactions", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get and set a tx note", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get and set multiple tx notes", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can check a transaction using secret key", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can prove a transaction by checking its signature", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can prove a spend using a generated signature and no destination public address", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can prove reserves in the wallet", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can prove reserves in an account", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get outputs in hex format", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can import outputs in hex format", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get key images", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can import key images", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can sign and verify messages", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get and set arbitrary key/value attributes", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can create a payment URI using the official URI spec", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can parse a payment URI using the official URI spec", async function() {
    throw new Error("Not implemented");
  });
}

module.exports.testWallet = testWallet;