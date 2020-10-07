const Web3 = require('web3');
let web3 = new Web3('https://mainnet.infura.io/v3/48fb0d9baafd4e28aa34f95d75f6d4ce');


async function getPastEventsFromMainnet(abi, address, eventName, topics) {
    // const cntr = new web3.eth.Contract(abi, address);
    // console.log(cntr.events);
    // const logs = await cntr.getPastEvents(eventName, {fromBlock: 0, toBlock: "latest", topics});
    // return logs;

    // parse them ourselves
    const eventAbi = abi.filter(i => i.type === "event" && i.name === eventName)[0];
    const sig = `${eventName}(${eventAbi.inputs.map( i => i.type).join(',')})`;
    const topic = web3.utils.keccak256(sig);
    const logs = await web3.eth.getPastLogs({
        fromBlock: '0x0',
        toBlock: 'latest',
        address,
        topics: [topic].concat(...(topics || []))
    });
    const decoded = logs.map(
        l => web3.eth.abi.decodeLog(
            eventAbi.inputs,
            l.data,
            l.anonymous ? l.topics : l.topics.slice(1)
        )
    );

    return decoded;
}

module.exports = {
    getPastEventsFromMainnet
}
