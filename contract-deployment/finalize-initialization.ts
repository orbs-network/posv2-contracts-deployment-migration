import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import fs from "fs";

const contractRegistryAddress = JSON.parse(fs.readFileSync('../deployed-contracts.json').toString()).contractRegistry;

async function finalizeInitialization() {
    const web3 = new Web3Driver();
    const accounts = await web3.eth.getAccounts();

    const initManager = accounts[0];

    const contractRegistry = web3.getExisting('ContractRegistry', contractRegistryAddress);
    const managedContracts = await contractRegistry.getManagedContracts();
    for (const contractAddr of managedContracts) {
        const contract = web3.getExisting('Initializable' as any, contractAddr);
        await contract.initializationComplete({from: initManager});
    }
}

finalizeInitialization().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);