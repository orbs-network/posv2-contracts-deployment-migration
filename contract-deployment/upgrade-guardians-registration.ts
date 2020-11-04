import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import {config} from "./config";
import {ContractRegistryContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/contract-registry-contract";
import {GuardiansRegistrationContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/guardian-registration-contract";
import {migrateGuardians} from "./migrate-guardians-lib";
const readline = require("readline-sync");

const CONTRACT_REGISTRY_ADDR = "0x5454223e3078Db87e55a15bE541cc925f3702eB0";

async function upgradeGuardiansRegistration() {
    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const registryAdmin = accounts[0];

    const contractRegistry: ContractRegistryContract = web3.getExisting('ContractRegistry', CONTRACT_REGISTRY_ADDR);

    const oldGuardiansRegistrationAddr = await contractRegistry.getContract('guardiansRegistration');
    console.log('oldGuardiansRegistrationAddr:', oldGuardiansRegistrationAddr);

    const cont = readline.question('continue? [yes/no]');
    if (cont != 'yes') {
        throw new Error("aborted by user");
    }

    const oldGuardiansRegistrationContract: GuardiansRegistrationContract = web3.getExisting('GuardiansRegistration', oldGuardiansRegistrationAddr);

    console.log('Deploying new version..')
    const newGuardiansRegistrationContract = await web3.deploy('GuardiansRegistration', [contractRegistry.address, registryAdmin]);
    console.log(`Deployed at: ${newGuardiansRegistrationContract.address}`);

    console.log("Locking previous contract..");
    await oldGuardiansRegistrationContract.lock();

    console.log('Migrating guardians..');
    await migrateGuardians(web3, newGuardiansRegistrationContract.address);

    console.log("Setting guardians registration in registry...");
    await contractRegistry.setContract("guardiansRegistration", newGuardiansRegistrationContract.address, true);
}

upgradeGuardiansRegistration().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);