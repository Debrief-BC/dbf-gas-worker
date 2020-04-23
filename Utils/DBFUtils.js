// This has to be updated with the debrief.js
// This is a temporary file

/* jshint esversion: 9 */


const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const axios = require("axios");
const config = require("../config.js");

const web3 = new Web3(config.web3.provider);
const privateKey = new Buffer(config.privateKey, "hex");

// Set wallet
const account = web3.eth.accounts.privateKeyToAccount("0x" + config.privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;


const Web3Utils = {
    transferGas: async (
        userId,
        userWallet,
        destinationWallet,
        amount,
        contract
    ) => {
        // Get coin contract
        let contractABI = config.coinABI;
        let coinContract = config.coinContract;
        if (contract) {
            coinContract = contract;
            const response = await axios.get(
                `${
          config.tokenEvents.etherscanAPI
        }/api?module=contract&action=getabi&address=${contract}`
            );
            contractABI = JSON.parse(response.data.result);
        }
        const CoinContract = new web3.eth.Contract(contractABI, coinContract);
        console.log("pre estimate");
        try {
            const gas = await CoinContract.methods
                .transfer(
                    destinationWallet,
                    web3.utils.toWei(Math.ceil(amount).toString())
                )
                .estimateGas({
                    from: userWallet
                });
            console.log("finished estimateGas");
            const gasPrice = await web3.eth.getGasPrice();

            const rawTx = {
                nonce: web3.utils.toHex(
                    await web3.eth.getTransactionCount(web3.eth.defaultAccount, "pending")
                ),
                gasPrice: web3.utils.toHex(gasPrice + 2),
                gasLimit: web3.utils.toHex(
                    await web3.eth.estimateGas({
                        from: web3.eth.defaultAccount,
                        to: userWallet,
                        value: web3.utils.toHex(gas * gasPrice)
                    })
                ),
                to: userWallet,
                value: web3.utils.toHex(gas * gasPrice)
            };
            // console.log(rawTx);
            const tx = new Tx(rawTx);
            tx.sign(privateKey);

            const serializedTx = tx.serialize();

            web3.eth
                .sendSignedTransaction("0x" + serializedTx.toString("hex"))
                .on("confirmation", (confirmation, receipt) => {
                    console.log("Gas Transfer => ", receipt);

                    axios.post(
                        `${config.api.basePath}/gas-claimed`, {
                            user: userId,
                            status: "ok",
                            transaction: receipt.blockHash
                        }, {
                            headers: {
                                username: config.api.username,
                                password: config.api.password
                            }
                        }
                    );
                });
        } catch (err) {
            console.log("Error => ", err);
            axios.post(
                `${config.api.basePath}/gas-claimed`, {
                    user: userId,
                    status: "failed"
                }, {
                    headers: {
                        username: config.api.username,
                        password: config.api.password
                    }
                }
            );
        }
    }
};

module.exports = Web3Utils;