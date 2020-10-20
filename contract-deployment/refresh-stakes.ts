import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import Web3 from "web3";
import {config} from "./config";
import {bn} from "./helpers";

const readline = require("readline-sync");

const DELEGATIONS_ADDR = "0x53d56b4b1EaEd898Be40cF445a715c55dDD6B09C";
const FROM_BLOCK = 11054302; // Creation of the delegations contract

async function listStakingAddressesToRefresh(): Promise<string[]> {
    const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/62f4815d28674debbe4703c5eb9d413c"))
    const stakingContract = new web3.eth.Contract(require("@orbs-network/orbs-ethereum-contracts-v2/release/build/contracts/IStakingContract.json").abi, config.stakingContractAddress);
    const events = await stakingContract.getPastEvents("allEvents", {
        // fromBlock: FROM_BLOCK.toString(),
        fromBlock: "earliest",
        toBlock: "latest",
    });

    const delegationsContract = new web3.eth.Contract(require("@orbs-network/orbs-ethereum-contracts-v2/release/build/contracts/Delegations.json").abi, DELEGATIONS_ADDR);

    let lastEvents = {};
    let addrs: string[] = [];
    for (const e of events) {
        if (["Staked", "Unstaked", "Restaked", "MigratedStake"].indexOf(e.event) != -1) {
            const {stakeOwner} = e.returnValues;
            if (stakeOwner == null) {
                throw new Error("Malformed or unexpected event: " + JSON.stringify(e));
            }
            lastEvents[stakeOwner] = e;
        }
    }

    console.log(`Checking ${Object.keys(lastEvents).length} addresses..`);

    for (const addr in lastEvents) {
        const e = lastEvents[addr];
        const knownStake = bn((await delegationsContract.methods.stakeOwnersData(addr).call()).stake);
        const actualStake = bn((await stakingContract.methods.getStakeBalanceOf(addr).call()));
        if (!bn(knownStake).eq(bn(actualStake))) {
            addrs.push(e.returnValues.stakeOwner as string)
        }
    }

    return addrs;
}

async function refreshStakes() {
    const web3 = new Web3Driver();

    console.log("listing stake events...");
    const addrsToRefresh = await listStakingAddressesToRefresh();

    console.log(`The following ${addrsToRefresh.length} addresses will be refreshed:`);
    for (const addr of addrsToRefresh) {
        console.log(addr);
    }

    let cont = readline.question('continue? [yes/no]');
    if (cont != 'yes') {
        throw new Error("aborted by user");
    }

    const gasPrice = bn(process.env.GAS_PRICE || "1000000000");
    const gasPriceGwei = gasPrice.div(bn(1e9));
    console.log("Gas price:", gasPriceGwei.toString(),  "gwei");

    cont = readline.question('continue? [yes/no]');
    if (cont != 'yes') {
        throw new Error("aborted by user");
    }

    let gas = 0;
    const delegations = web3.getExisting('Delegations', DELEGATIONS_ADDR);
    (await Promise.all(addrsToRefresh.map(async (addr) => {
        console.log('Refreshing', addr);
        return delegations.refreshStake(addr);
    }))).map(r => gas += r.gasUsed);

    console.log(`gas: ${gas}, gasPrice: ${gasPriceGwei.toString()} gwei, total ETH: ${Web3.utils.fromWei(gasPrice.mul(bn(gas)))}`);
}

refreshStakes().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);