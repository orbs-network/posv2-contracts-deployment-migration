const Web3 = require('web3');

const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid";
const ethereumMainnetUrl = `https://mainnet.infura.io/v3/48fb0d9baafd4e28aa34f95d75f6d4ce`;

let web3 = new Web3('https://mainnet.infura.io/v3/48fb0d9baafd4e28aa34f95d75f6d4ce');

async function getPastEventsFromMainnet() {

    return cntr.staking.getPastEvents("Staked", {fromBlock: 0, toBlock: "latest"});
}


module.exports = {
    getPastEventsFromMainnet
}
