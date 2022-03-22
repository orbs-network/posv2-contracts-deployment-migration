import {
    getAbiByContractAddress,
    getAbiByContractRegistryKey,
    Web3Driver
} from "@orbs-network/orbs-ethereum-contracts-v2";
import Web3 from "web3";
import * as fs from "fs";
import {config, chainId} from "./config";
import {DEPLOYMENT_SUBSET_CANARY, DEPLOYMENT_SUBSET_MAIN, ZERO_ADDR} from "./helpers";

const readline = require("readline-sync");

async function deploy() {
    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const initManager = accounts[0];

    const registryAdmin = config.registryAdminAddress;

    const cont = readline.question('continue? [yes/no]');
    if (cont != 'yes') {
        throw new Error("aborted by user");
    }

    const contractRegistry = await web3.deploy('ContractRegistry', [ZERO_ADDR, registryAdmin], {chainId: chainId});
    const delegations = await web3.deploy("Delegations", [contractRegistry.address, registryAdmin], {chainId: chainId});
    const stakingContractHandler = await web3.deploy('StakingContractHandler', [contractRegistry.address, registryAdmin], {chainId: chainId});
    const stakingRewards = await web3.deploy('StakingRewards', [contractRegistry.address, registryAdmin, config.orbsTokenAddress,
            config.stakingRewardsAnnualRateInPercentMille,
            config.stakingRewardsAnnualCap,
            config.defaultDelegatorsStakingRewardsPercentMille,
            config.maxDelegatorsStakingRewardsPercentMille,
            ZERO_ADDR,
            []
        ], {chainId: chainId});
    const feesAndBootstrapRewards = await web3.deploy('FeesAndBootstrapRewards', [contractRegistry.address, registryAdmin, config.orbsTokenAddress, config.bootstrapTokenAddress,
            config.generalCommitteeAnnualBootstrap,
            config.certifiedCommitteeAnnualBootstrap,
        ], {chainId: chainId});
    const elections = await web3.deploy("Elections", [contractRegistry.address, registryAdmin, config.minSelfStakePercentMille, config.voteUnreadyThresholdPercentMille, config.voteOutThresholdPercentMille], {chainId: chainId});
    const subscriptions = await web3.deploy('Subscriptions', [contractRegistry.address, registryAdmin, config.orbsTokenAddress, config.genesisRefTimeDelay, config.minimumInitialVcPayment, [], config.nextVcId, ZERO_ADDR], {chainId: chainId});
    const protocol = await web3.deploy('Protocol', [contractRegistry.address, registryAdmin], {chainId: chainId});
    const certification = await web3.deploy('Certification', [contractRegistry.address, registryAdmin], {chainId: chainId});
    const committee = await web3.deploy('Committee', [contractRegistry.address, registryAdmin, config.maxCommitteeSize], {chainId: chainId});
    const stakingRewardsWallet = await web3.deploy('ProtocolWallet', [config.orbsTokenAddress, stakingRewards.address, config.stakingRewardsWalletRate], {chainId: chainId});
    const bootstrapRewardsWallet = await web3.deploy('ProtocolWallet', [config.bootstrapTokenAddress, feesAndBootstrapRewards.address, config.bootstrapRewardsWalletRate], {chainId: chainId});
    const guardiansRegistration = await web3.deploy('GuardiansRegistration', [contractRegistry.address, registryAdmin], {chainId: chainId});
    const generalFeesWallet = await web3.deploy('FeesWallet', [contractRegistry.address, registryAdmin, config.orbsTokenAddress], {chainId: chainId});
    const certifiedFeesWallet = await web3.deploy('FeesWallet', [contractRegistry.address, registryAdmin, config.orbsTokenAddress], {chainId: chainId});

    await Promise.all([
        contractRegistry.setContract("staking", config.stakingContractAddress, false, {chainId: chainId}),
        contractRegistry.setContract("stakingRewards", stakingRewards.address, true, {chainId: chainId}),
        contractRegistry.setContract("feesAndBootstrapRewards", feesAndBootstrapRewards.address, true, {chainId: chainId}),
        contractRegistry.setContract("delegations", delegations.address, true, {chainId: chainId}),
        contractRegistry.setContract("elections", elections.address, true, {chainId: chainId}),
        contractRegistry.setContract("subscriptions", subscriptions.address, true, {chainId: chainId}),
        contractRegistry.setContract("protocol", protocol.address, true, {chainId: chainId}),
        contractRegistry.setContract("certification", certification.address, true, {chainId: chainId}),
        contractRegistry.setContract("guardiansRegistration", guardiansRegistration.address, true, {chainId: chainId}),
        contractRegistry.setContract("committee", committee.address, true, {chainId: chainId}),
        contractRegistry.setContract("stakingRewardsWallet", stakingRewardsWallet.address, false, {chainId: chainId}),
        contractRegistry.setContract("bootstrapRewardsWallet", bootstrapRewardsWallet.address, false, {chainId: chainId}),
        contractRegistry.setContract("generalFeesWallet", generalFeesWallet.address, true, {chainId: chainId}),
        contractRegistry.setContract("certifiedFeesWallet", certifiedFeesWallet.address, true, {chainId: chainId}),
        contractRegistry.setContract("stakingContractHandler", stakingContractHandler.address, true, {chainId: chainId}),
    ]);

    await protocol.createDeploymentSubset(DEPLOYMENT_SUBSET_MAIN, 1, {chainId: chainId});
    await protocol.createDeploymentSubset(DEPLOYMENT_SUBSET_CANARY, 1, {chainId: chainId});

    const subscriber = await web3.deploy('MonthlySubscriptionPlan', [contractRegistry.address, registryAdmin, config.orbsTokenAddress, config.subscriptionTier, config.subscriptionRate], {chainId: chainId});
    await subscriptions.addSubscriber(subscriber.address, {chainId: chainId});

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
    };

    const outputFile = process.argv.length > 1 && process.argv.slice(-2)[0] == "-o" ? process.argv.slice(-1)[0] : "deploy-contracts-output.json";
    console.log('Writing output JSON to ' + outputFile);
    fs.writeFileSync(outputFile, JSON.stringify(contracts, null, 2));
}

deploy().then(
    () => {
        console.log('Done');
        process.exit(0);
    }).catch(
   (e) => {
        console.error(e);
        process.exit(1);
    });
