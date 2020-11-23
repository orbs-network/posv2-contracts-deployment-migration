import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import {config} from "./config";

const readline = require("readline-sync");

const CONTRACT_REGISTRY_ADDR = "0xD859701C81119aB12A1e62AF6270aD2AE05c7AB3";

async function upgradeCommittee() {
    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const registryAdmin = config.registryAdminAddress;

    const contractRegistry = web3.getExisting('ContractRegistry', CONTRACT_REGISTRY_ADDR);

    console.log("Locking contracts..");
    await contractRegistry.lockContracts();
    console.log("Done locking contracts");

    const prevCommitteeAddr = await contractRegistry.getContract("committee");

    console.log(`Previous committee contract: ${prevCommitteeAddr}`);

    const cont = readline.question('continue? [yes/no]');
    if (cont != 'yes') {
        throw new Error("aborted by user");
    }

    const committee = await web3.deploy('Committee', [contractRegistry.address, registryAdmin, config.maxCommitteeSize]);

    console.log("Migrating committee...");
    await committee.importMembers(prevCommitteeAddr, {from: accounts[0]});

    console.log("Setting committee in registry...");
    await contractRegistry.setContract("committee", committee.address, true);

    console.log(`committee: ${committee.address}`);

    console.log("Unlocking contracts..");
    await contractRegistry.unlockContracts();
    console.log("Done unlocking contracts");
}

upgradeCommittee().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);