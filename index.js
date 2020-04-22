
'use strict';

const Web3Utils = require("./Utils/Web3Utils.js");
const redis = require('redis');

const subscriber = redis.createClient(config.redisPubsub);

subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  Web3Utils.transferGas(data.userId, data.userWallet, data.destinationWallet, data.amount, data.contract);
});

subscriber.subscribe('claimGas');
