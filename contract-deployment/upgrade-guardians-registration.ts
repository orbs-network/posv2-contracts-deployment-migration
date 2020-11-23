import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import {config} from "./config";
import {ContractRegistryContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/contract-registry-contract";
import {GuardiansRegistrationContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/guardian-registration-contract";
import {migrateGuardians} from "./migrate-guardians-lib";
const readline = require("readline-sync");

const CONTRACT_REGISTRY_ADDR = "0xD859701C81119aB12A1e62AF6270aD2AE05c7AB3";
const PREVIOUS_GUARDIAN_REGISTRATION_CONTRACT_ADDR = "0xce97f8c79228c53b8b9ad86800a493d1e7e5d1e3";

async function upgradeGuardiansRegistration() {
    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const registryAdmin = accounts[0];

    const contractRegistry: ContractRegistryContract = web3.getExisting('ContractRegistry', CONTRACT_REGISTRY_ADDR) as any;

    const oldGuardiansRegistrationAddr = await contractRegistry.getContract('guardiansRegistration');
    console.log('oldGuardiansRegistrationAddr:', oldGuardiansRegistrationAddr);

    const cont = readline.question('continue? [yes/no]');
    if (cont != 'yes') {
        throw new Error("aborted by user");
    }

    const oldGuardiansRegistrationContract: GuardiansRegistrationContract = web3.getExisting('GuardiansRegistration', oldGuardiansRegistrationAddr) as any;

    console.log('Deploying new version..')
    const newGuardiansRegistrationContract = await web3.deploy('GuardiansRegistration', [contractRegistry.address, registryAdmin]);
    console.log(`Deployed at: ${newGuardiansRegistrationContract.address}`);

    console.log("Locking previous contract..");
    await oldGuardiansRegistrationContract.lock();

    console.log('Migrating guardians..');
    await migrateGuardians(web3, PREVIOUS_GUARDIAN_REGISTRATION_CONTRACT_ADDR, newGuardiansRegistrationContract.address);

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