import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import {config} from "./config";

const CONTRACT_REGISTRY_ADDR = "0x5454223e3078Db87e55a15bE541cc925f3702eB0";

async function upgradeElections() {
    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const registryAdmin = accounts[0];

    const contractRegistry = web3.getExisting('ContractRegistry', CONTRACT_REGISTRY_ADDR);

    console.log("Locking contracts..");
    await contractRegistry.lockContracts();
    console.log("Done locking contracts");

    const elections = await web3.deploy("Elections", [contractRegistry.address, registryAdmin, config.minSelfStakePercentMille, config.voteUnreadyThresholdPercentMille, config.voteOutThresholdPercentMille]);

    console.log("Setting elections in registry...");
    await contractRegistry.setContract("elections", elections.address, true, {from: registryAdmin});

    console.log(`elections: ${elections.address}`);

    console.log("Unlocking contracts..");
    await contractRegistry.unlockContracts();
    console.log("Done unlocking contracts");
}

upgradeElections().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);