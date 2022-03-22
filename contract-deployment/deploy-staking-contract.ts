import {
    Web3Driver
} from "@orbs-network/orbs-ethereum-contracts-v2";
import {config, chainId} from "./config";

const readline = require("readline-sync");

async function deploy() {

	console.log('Deploying staking contract ...')

    let web3 = new Web3Driver();

    const cont = readline.question('continue? [yes/no]');
    if (cont != 'yes') {
        throw new Error("aborted by user");
    }

    const stakingContract = await web3.deploy('StakingContract', [config.cooldownPeriodInSec, config.migrationManager, config.emergencyManager, config.orbsTokenAddress], {chainId: chainId});

    console.log(`stakingContract deployed to address: ${stakingContract.address}`);
}

deploy().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);
