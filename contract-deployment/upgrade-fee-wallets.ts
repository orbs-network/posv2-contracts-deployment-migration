import {getAbiByContractRegistryKey, Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import {config} from "./config";
import {StakingRewardsContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/staking-rewards-contract";
import {FeesAndBootstrapRewardsContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/fees-and-bootstrap-rewards-contract";
import {ContractRegistryContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/contract-registry-contract";
import {ProtocolWalletContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/protocol-wallet-contract";
import {ZERO_ADDR} from "./helpers";
import {FeesWalletContract} from "@orbs-network/orbs-ethereum-contracts-v2/typings/fees-wallet-contract";

const readline = require("readline-sync");

const CONTRACT_REGISTRY_ADDR = "0x5454223e3078Db87e55a15bE541cc925f3702eB0";

async function upgradeFeeWallets() {
    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const registryAdmin = accounts[0];

    const contractRegistry: ContractRegistryContract = web3.getExisting('ContractRegistry', CONTRACT_REGISTRY_ADDR);

    const oldGeneralFeesWalletAddr = await contractRegistry.getContract('generalFeesWallet');
    const oldCertifiedFeesWalletAddr = await contractRegistry.getContract('certifiedFeesWallet');

    console.log(`Previous generalFeesWallet contract: ${oldGeneralFeesWalletAddr}`);
    console.log(`Previous certifiedFeesWallet contract: ${oldCertifiedFeesWalletAddr}`);
    if (readline.question('continue? [yes/no]') != 'yes') {
        throw new Error("aborted by user");
    }

    const oldGeneralFeesWallet: FeesWalletContract = web3.getExisting('FeesWallet', oldGeneralFeesWalletAddr);
    const oldCertifiedFeesWallet: FeesWalletContract = web3.getExisting('FeesWallet', oldCertifiedFeesWalletAddr);

    console.log('locking previous wallets..');
    await oldGeneralFeesWallet.lock();
    await oldCertifiedFeesWallet.lock();

    console.log('Deploying new fee wallets..');
    const newGeneralFeesWallet: FeesWalletContract = await web3.deploy('FeesWallet', [contractRegistry.address, registryAdmin, config.orbsTokenAddress]);
    const newCertifiedFeesWallet: FeesWalletContract = await web3.deploy('FeesWallet', [contractRegistry.address, registryAdmin, config.orbsTokenAddress]);

    console.log(`New generalFeesWallet contract: ${newGeneralFeesWallet.address}`);
    console.log(`New certifiedFeesWallet contract: ${newCertifiedFeesWallet.address}`);

    console.log('migrating reward buckets..');
    await oldGeneralFeesWallet.migrateBucket(newGeneralFeesWallet.address, 1604448000);
    await oldGeneralFeesWallet.migrateBucket(newGeneralFeesWallet.address, 1601856000);

    console.log('Setting in registry..');
    await contractRegistry.setContract('generalFeesWallet', newGeneralFeesWallet.address, true);
    await contractRegistry.setContract('certifiedFeesWallet', newCertifiedFeesWallet.address, true);
}

upgradeFeeWallets().then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);