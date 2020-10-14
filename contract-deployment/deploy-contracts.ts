import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";
import Web3 from "web3";
import * as fs from "fs";
import BN from "bn.js";
import {config} from "./config";

const readline = require("readline-sync");

export const DEPLOYMENT_SUBSET_MAIN = "main";
export const DEPLOYMENT_SUBSET_CANARY = "canary";
export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";


const oldGuardianRegistrationABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"addr","type":"address"}],"name":"ContractRegistryAddressUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousFunctionalOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newFunctionalOwner","type":"address"}],"name":"FunctionalOwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"addr","type":"address"},{"indexed":false,"internalType":"bytes4","name":"ip","type":"bytes4"},{"indexed":false,"internalType":"address","name":"orbsAddr","type":"address"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"website","type":"string"},{"indexed":false,"internalType":"string","name":"contact","type":"string"}],"name":"GuardianDataUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"addr","type":"address"},{"indexed":false,"internalType":"string","name":"key","type":"string"},{"indexed":false,"internalType":"string","name":"newValue","type":"string"},{"indexed":false,"internalType":"string","name":"oldValue","type":"string"}],"name":"GuardianMetadataChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"addr","type":"address"}],"name":"GuardianRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"addr","type":"address"}],"name":"GuardianUnregistered","type":"event"},{"anonymous":false,"inputs":[],"name":"Locked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousMigrationOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newMigrationOwner","type":"address"}],"name":"MigrationOwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[],"name":"Unlocked","type":"event"},{"constant":false,"inputs":[],"name":"claimFunctionalOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"claimMigrationOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"functionalOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getBootstrapRewardsWallet","outputs":[{"internalType":"contract IProtocolWallet","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCertificationContract","outputs":[{"internalType":"contract ICertification","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCommitteeContract","outputs":[{"internalType":"contract ICommittee","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getDelegationsContract","outputs":[{"internalType":"contract IDelegations","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getElectionsContract","outputs":[{"internalType":"contract IElections","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address[]","name":"orbsAddrs","type":"address[]"}],"name":"getEthereumAddresses","outputs":[{"internalType":"address[]","name":"ethereumAddrs","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"getGuardianData","outputs":[{"internalType":"bytes4","name":"ip","type":"bytes4"},{"internalType":"address","name":"orbsAddr","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"website","type":"string"},{"internalType":"string","name":"contact","type":"string"},{"internalType":"uint256","name":"registration_time","type":"uint256"},{"internalType":"uint256","name":"last_update_time","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"getGuardianIp","outputs":[{"internalType":"bytes4","name":"ip","type":"bytes4"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address[]","name":"addrs","type":"address[]"}],"name":"getGuardianIps","outputs":[{"internalType":"bytes4[]","name":"ips","type":"bytes4[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address[]","name":"addrs","type":"address[]"}],"name":"getGuardiansOrbsAddress","outputs":[{"internalType":"address[]","name":"orbsAddrs","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getGuardiansRegistrationContract","outputs":[{"internalType":"contract IGuardiansRegistration","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"string","name":"key","type":"string"}],"name":"getMetadata","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address[]","name":"ethereumAddrs","type":"address[]"}],"name":"getOrbsAddresses","outputs":[{"internalType":"address[]","name":"orbsAddrs","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getProtocolContract","outputs":[{"internalType":"contract IProtocol","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getRewardsContract","outputs":[{"internalType":"contract IRewards","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getStakingContract","outputs":[{"internalType":"contract IStakingContract","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getStakingRewardsWallet","outputs":[{"internalType":"contract IProtocolWallet","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getSubscriptionsContract","outputs":[{"internalType":"contract ISubscriptions","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"string","name":"","type":"string"}],"name":"guardianMetadata","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"guardians","outputs":[{"internalType":"address","name":"orbsAddr","type":"address"},{"internalType":"bytes4","name":"ip","type":"bytes4"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"website","type":"string"},{"internalType":"string","name":"contact","type":"string"},{"internalType":"uint256","name":"registrationTime","type":"uint256"},{"internalType":"uint256","name":"lastUpdateTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"name":"ipToGuardian","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isFunctionalOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isMigrationOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"isRegistered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"locked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"migrationOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"orbsAddressToEthereumAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes4","name":"ip","type":"bytes4"},{"internalType":"address","name":"orbsAddr","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"website","type":"string"},{"internalType":"string","name":"contact","type":"string"}],"name":"registerGuardian","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renounceFunctionalOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renounceMigrationOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"ethereumOrOrbsAddress","type":"address"}],"name":"resolveGuardianAddress","outputs":[{"internalType":"address","name":"ethereumAddress","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"contract IContractRegistry","name":"_contractRegistry","type":"address"}],"name":"setContractRegistry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"key","type":"string"},{"internalType":"string","name":"value","type":"string"}],"name":"setMetadata","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newFunctionalOwner","type":"address"}],"name":"transferFunctionalOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newMigrationOwner","type":"address"}],"name":"transferMigrationOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"unlock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"unregisterGuardian","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes4","name":"ip","type":"bytes4"},{"internalType":"address","name":"orbsAddr","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"website","type":"string"},{"internalType":"string","name":"contact","type":"string"}],"name":"updateGuardian","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes4","name":"ip","type":"bytes4"}],"name":"updateGuardianIp","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]

async function listGuardians(guardianRegistrationContractAddr: string): Promise<string[]> {
    const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/62f4815d28674debbe4703c5eb9d413c"))
    const contract = new web3.eth.Contract(oldGuardianRegistrationABI as any, guardianRegistrationContractAddr);
    const events = await contract.getPastEvents("allEvents", {
        fromBlock: "earliest",
        toBlock: "latest",
    });
    let guardians: string[] = [];
    for (const e of events) {
        if (e.event == "GuardianRegistered") {
            guardians.push(e.returnValues.addr as string)
        }
        if (e.event == "GuardianUnregistered") {
            guardians = guardians.filter(addr => addr != e.returnValues.addr)
        }
    }

    return guardians;
}

async function lockExistingContracts(web3: Web3Driver, contractsToLock: string[], migrationManager: string) {
    for (const addr of contractsToLock) {
        console.log('Locking contract:', addr);
        const contract = web3.getExisting("Lockable" as any, addr);
        await contract.lock({from: migrationManager});
    }
}

async function deploy() {
    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const initManager = accounts[0];
    const registryAdmin = accounts[0];
    const migrationManager = accounts[0];
    const functionalManager = accounts[0];

    await lockExistingContracts(web3, config.existingContractsToLock, accounts[0])
    console.log("Done locking contracts");

    console.log("listing guardians...");
    const guardiansToMigrate = await listGuardians(config.previousGuardianRegistrationContractAddr);

    console.log('The following guardians will be migrated:');
    for (const guardian of guardiansToMigrate) {
        console.log(guardian);
    }

    const cont = readline.question('continue? [yes/no]');
    if (cont != 'yes') {
        throw new Error("aborted by user");
    }

    const contractRegistry = await web3.deploy('ContractRegistry', [ZERO_ADDR, registryAdmin]);
    const delegations = await web3.deploy("Delegations", [contractRegistry.address, registryAdmin]);
    const stakingContractHandler = await web3.deploy('StakingContractHandler', [contractRegistry.address, registryAdmin]);
    const stakingRewards = await web3.deploy('StakingRewards', [contractRegistry.address, registryAdmin, config.orbsTokenAddress,
            config.stakingRewardsAnnualRateInPercentMille,
            config.stakingRewardsAnnualCap,
            config.defaultDelegatorsStakingRewardsPercentMille,
            config.maxDelegatorsStakingRewardsPercentMille,
            ZERO_ADDR,
            []
        ]);
    const feesAndBootstrapRewards = await web3.deploy('FeesAndBootstrapRewards', [contractRegistry.address, registryAdmin, config.orbsTokenAddress, config.bootstrapTokenAddress,
            config.generalCommitteeAnnualBootstrap,
            config.certifiedCommitteeAnnualBootstrap,
        ]);
    const elections = await web3.deploy("Elections", [contractRegistry.address, registryAdmin, config.minSelfStakePercentMille, config.voteUnreadyThresholdPercentMille, config.voteOutThresholdPercentMille]);
    const subscriptions = await web3.deploy('Subscriptions', [contractRegistry.address, registryAdmin, config.orbsTokenAddress, config.genesisRefTimeDelay, config.minimumInitialVcPayment, [], config.nextVcId, ZERO_ADDR]);
    const protocol = await web3.deploy('Protocol', [contractRegistry.address, registryAdmin]);
    const certification = await web3.deploy('Certification', [contractRegistry.address, registryAdmin]);
    const committee = await web3.deploy('Committee', [contractRegistry.address, registryAdmin, config.maxCommitteeSize]);
    const stakingRewardsWallet = await web3.deploy('ProtocolWallet', [config.orbsTokenAddress, stakingRewards.address, config.stakingRewardsWalletRate]);
    const bootstrapRewardsWallet = await web3.deploy('ProtocolWallet', [config.bootstrapTokenAddress, feesAndBootstrapRewards.address, config.bootstrapRewardsWalletRate]);
    const guardiansRegistration = await web3.deploy('GuardiansRegistration', [contractRegistry.address, registryAdmin]);
    const generalFeesWallet = await web3.deploy('FeesWallet', [contractRegistry.address, registryAdmin, config.orbsTokenAddress]);
    const certifiedFeesWallet = await web3.deploy('FeesWallet', [contractRegistry.address, registryAdmin, config.orbsTokenAddress]);

    await guardiansRegistration.migrateGuardians(guardiansToMigrate, config.previousGuardianRegistrationContractAddr);

    await Promise.all([
        contractRegistry.setContract("staking", config.stakingContractAddress, false, {from: registryAdmin}),
        contractRegistry.setContract("stakingRewards", stakingRewards.address, true, {from: registryAdmin}),
        contractRegistry.setContract("feesAndBootstrapRewards", feesAndBootstrapRewards.address, true, {from: registryAdmin}),
        contractRegistry.setContract("delegations", delegations.address, true, {from: registryAdmin}),
        contractRegistry.setContract("elections", elections.address, true, {from: registryAdmin}),
        contractRegistry.setContract("subscriptions", subscriptions.address, true, {from: registryAdmin}),
        contractRegistry.setContract("protocol", protocol.address, true, {from: registryAdmin}),
        contractRegistry.setContract("certification", certification.address, true, {from: registryAdmin}),
        contractRegistry.setContract("guardiansRegistration", guardiansRegistration.address, true, {from: registryAdmin}),
        contractRegistry.setContract("committee", committee.address, true, {from: registryAdmin}),
        contractRegistry.setContract("stakingRewardsWallet", stakingRewardsWallet.address, false, {from: registryAdmin}),
        contractRegistry.setContract("bootstrapRewardsWallet", bootstrapRewardsWallet.address, false, {from: registryAdmin}),
        contractRegistry.setContract("generalFeesWallet", generalFeesWallet.address, true, {from: registryAdmin}),
        contractRegistry.setContract("certifiedFeesWallet", certifiedFeesWallet.address, true, {from: registryAdmin}),
        contractRegistry.setContract("stakingContractHandler", stakingContractHandler.address, true, {from: registryAdmin}),
    ]);

    await contractRegistry.setManager("migrationManager", migrationManager, {from: registryAdmin});
    await contractRegistry.setManager("functionalManager", functionalManager, {from: registryAdmin});

    for (const wallet of [stakingRewardsWallet, bootstrapRewardsWallet]) {
        await wallet.transferMigrationOwnership(migrationManager);
        await wallet.claimMigrationOwnership({from: migrationManager});
        await wallet.transferFunctionalOwnership(functionalManager);
        await wallet.claimFunctionalOwnership({from: functionalManager});
    }

    await protocol.createDeploymentSubset(DEPLOYMENT_SUBSET_MAIN, 1, {from: functionalManager});
    await protocol.createDeploymentSubset(DEPLOYMENT_SUBSET_CANARY, 1, {from: functionalManager});

    const subscriber = await web3.deploy('MonthlySubscriptionPlan', [contractRegistry.address, registryAdmin, config.orbsTokenAddress, config.subscriptionTier, config.subscriptionRate]);
    await subscriptions.addSubscriber(subscriber.address, {from: functionalManager});

    console.log(`contractRegistry: ${contractRegistry.address}`);
    console.log(`delegations: ${delegations.address}`);
    console.log(`externalToken: ${config.bootstrapTokenAddress}`);
    console.log(`erc20: ${config.orbsTokenAddress}`);
    console.log(`stakingContractHandler: ${stakingContractHandler.address}`);
    console.log(`stakingRewards: ${stakingRewards.address}`);
    console.log(`feesAndBootstrapRewards: ${feesAndBootstrapRewards.address}`);
    console.log(`elections: ${elections.address}`);
    console.log(`subscriptions: ${subscriptions.address}`);
    console.log(`protocol: ${protocol.address}`);
    console.log(`certification: ${certification.address}`);
    console.log(`committee: ${committee.address}`);
    console.log(`stakingRewardsWallet: ${stakingRewardsWallet.address}`);
    console.log(`bootstrapRewardsWallet: ${bootstrapRewardsWallet.address}`);
    console.log(`guardiansRegistration: ${guardiansRegistration.address}`);
    console.log(`generalFeesWallet: ${generalFeesWallet.address}`);
    console.log(`certifiedFeesWallet: ${certifiedFeesWallet.address}`);
    console.log(`subscriber: ${subscriber.address}`);

    const contracts = {
        contractRegistry: contractRegistry.address,
        delegations: delegations.address,
        externalToken: config.bootstrapTokenAddress,
        erc20: config.orbsTokenAddress,
        stakingContractHandler: stakingContractHandler.address,
        stakingRewards: stakingRewards.address,
        feesAndBootstrapRewards: feesAndBootstrapRewards.address,
        elections: elections.address,
        subscriptions: subscriptions.address,
        protocol: protocol.address,
        certification: certification.address,
        committee: committee.address,
        stakingRewardsWallet: stakingRewardsWallet.address,
        bootstrapRewardsWallet: bootstrapRewardsWallet.address,
        guardiansRegistration: guardiansRegistration.address,
        generalFeesWallet: generalFeesWallet.address,
        certifiedFeesWallet: certifiedFeesWallet.address,
        subscriber: subscriber.address,

        initManager,
        registryAdmin,
        migrationManager,
        functionalManager
    };

    const outputFile = process.argv.length > 1 && process.argv.slice(-2)[0] == "-o" ? process.argv.slice(-1)[0] : "deploy-contracts-output.json";
    console.log('Writing output JSON to ' + outputFile);
    fs.writeFileSync(outputFile, JSON.stringify(contracts, null, 2));
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