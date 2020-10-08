import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import Web3 from "web3";
import * as fs from "fs";
import BN from "bn.js";

export const DEPLOYMENT_SUBSET_MAIN = "main";
export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const bn = x => new BN(x);

export const options = {
    contractRegistryAddress: "", // TODO
    previousCommitteeContractAddress: "" // TODO
};

async function finalizeDeployment() {
    const web3 = new Web3Driver();
    const accounts = await web3.getAccounts();

    const initManager = accounts[0];
    const registryAdmin = accounts[1];
    const migrationManager = accounts[2];
    const functionalManager = accounts[3];

    const contractRegistry = web3.getExisting('ContractRegistry', options.contractRegistryAddress);
    const electionsContract = web3.getExisting('Elections', await contractRegistry.getContract('elections') as any);
    const stakingRewardsContract = web3.getExisting('StakingRewards', await contractRegistry.getContract('stakingRewards') as any);
    const feesAndBootstrapRewardsContract = web3.getExisting('FeesAndBootstrapRewards', await contractRegistry.getContract('feesAndBootstrapRewards') as any);
    const committeeContract = web3.getExisting('Committee', await contractRegistry.getContract('committee') as any);
    const previousCommitteeContract = web3.getExisting('Committee', options.previousCommitteeContractAddress);

    const committee = (await previousCommitteeContract.getCommittee())[0];
    await committeeContract.unlock({from: initManager});
    await electionsContract.initReadyForCommittee(committee, {from: initManager});
    await committeeContract.emitCommitteeSnapshot();

    await feesAndBootstrapRewardsContract.activateRewardDistribution({from: initManager});
    await stakingRewardsContract.activateRewardDistribution({from: initManager});

    const managedContracts = await contractRegistry.getManagedContracts();
    for (const contract of managedContracts) {
        await contract.initializationComplete({from: initManager});
    }
}

finalizeDeployment().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
).catch(
    (e) => console.error(e)
);