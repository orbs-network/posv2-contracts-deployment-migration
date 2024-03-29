import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import * as fs from "fs";

const contractRegistryAddress = JSON.parse(fs.readFileSync('../deployed-contracts.json').toString()).contractRegistry;

import {chainId} from "./config";

async function activateRewardDistribution() {
    console.log('ContractRegistry address:' + contractRegistryAddress);
    // console.log('Previous committee contract address:' + config.previousCommitteeContractAddress);

    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const initManager = accounts[0];
    const contractRegistry = web3.getExisting('ContractRegistry', contractRegistryAddress);
    // const electionsContract = web3.getExisting('Elections', await contractRegistry.getContract('elections') as any);
    const stakingRewardsContract = web3.getExisting('StakingRewards', await contractRegistry.getContract('stakingRewards') as any);
    const feesAndBootstrapRewardsContract = web3.getExisting('FeesAndBootstrapRewards', await contractRegistry.getContract('feesAndBootstrapRewards') as any);
    // const committeeContract = web3.getExisting('Committee', await contractRegistry.getContract('committee') as any);

    // const previousCommitteeContract = web3.getExisting('Committee', config.previousCommitteeContractAddress);
    //
    // const committee = (await previousCommitteeContract.getCommittee())[0];
    // console.log('Previous committee:', committee);
    //
    // const cont = readline.question('continue? [yes/no]');
    // if (cont != 'yes') {
    //     throw new Error("aborted by user");
    // }
    //
    // await electionsContract.initReadyForCommittee(committee, {from: initManager});
    // await committeeContract.emitCommitteeSnapshot();

    await feesAndBootstrapRewardsContract.activateRewardDistribution(await web3.now(), {from: initManager, chainId: chainId});
    await stakingRewardsContract.activateRewardDistribution(await web3.now(), {from: initManager, chainId: chainId});
}

activateRewardDistribution().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e)
        process.exit(1);
    }
);
