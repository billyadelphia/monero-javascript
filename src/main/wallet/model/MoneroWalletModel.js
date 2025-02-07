module.exports = function() {
  
  // import daemon models
  require("../../daemon/model/MoneroDaemonModel")();
  
  // import wallet models
  this.MoneroAccount = require("./MoneroAccount");
  this.MoneroAccountTag = require("./MoneroAccountTag");
  this.MoneroAddressBookEntry = require("./MoneroAddressBookEntry");
  this.MoneroCheck = require("./MoneroCheck");
  this.MoneroCheckReserve = require("./MoneroCheckReserve");
  this.MoneroCheckTx = require("./MoneroCheckTx");
  this.MoneroDestination = require("./MoneroDestination");
  this.MoneroIncomingTransfer = require("./MoneroIncomingTransfer");
  this.MoneroIntegratedAddress = require("./MoneroIntegratedAddress");
  this.MoneroKeyImageImportResult = require("./MoneroKeyImageImportResult");
  this.MoneroMultisigInfo = require("./MoneroMultisigInfo");
  this.MoneroMultisigInitResult = require("./MoneroMultisigInitResult");
  this.MoneroMultisigSignResult = require("./MoneroMultisigSignResult");
  this.MoneroOutgoingTransfer = require("./MoneroOutgoingTransfer");
  this.MoneroOutputWallet = require("./MoneroOutputWallet");
  this.MoneroOutputQuery = require("./MoneroOutputQuery");
  this.MoneroSendPriority = require("./MoneroSendPriority");
  this.MoneroSendRequest = require("./MoneroSendRequest");
  this.MoneroSubaddress = require("./MoneroSubaddress");
  this.MoneroSyncResult = require("./MoneroSyncResult");
  this.MoneroTransfer = require("./MoneroTransfer");
  this.MoneroTransferQuery = require("./MoneroTransferQuery");
  this.MoneroTxQuery = require("./MoneroTxQuery");
  this.MoneroTxSet = require("./MoneroTxSet");
  this.MoneroTxWallet = require("./MoneroTxWallet");
}