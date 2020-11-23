import {
    getAbiByContractAddress,
    getAbiByContractRegistryKey,
    Web3Driver
} from "@orbs-network/orbs-ethereum-contracts-v2";
import Web3 from "web3";
import * as fs from "fs";
import {config} from "./config";
import {DEPLOYMENT_SUBSET_CANARY, DEPLOYMENT_SUBSET_MAIN, ZERO_ADDR} from "./helpers";

const readline = require("readline-sync");

async function deploy() {
    const web3 = new Web3Driver();

    const accounts = await web3.eth.getAccounts();

    const initManager = accounts[0];

    const registryAdmin = config.registryAdminAddress;

    console.log('registryAdmin:', registryAdmin);

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

    await Promise.all([
        contractRegistry.setContract("staking", config.stakingContractAddress, false),
        contractRegistry.setContract("stakingRewards", stakingRewards.address, true),
        contractRegistry.setContract("feesAndBootstrapRewards", feesAndBootstrapRewards.address, true),
        contractRegistry.setContract("delegations", delegations.address, true),
        contractRegistry.setContract("elections", elections.address, true),
        contractRegistry.setContract("subscriptions", subscriptions.address, true),
        contractRegistry.setContract("protocol", protocol.address, true),
        contractRegistry.setContract("certification", certification.address, true),
        contractRegistry.setContract("guardiansRegistration", guardiansRegistration.address, true),
        contractRegistry.setContract("committee", committee.address, true),
        contractRegistry.setContract("stakingRewardsWallet", stakingRewardsWallet.address, false),
        contractRegistry.setContract("bootstrapRewardsWallet", bootstrapRewardsWallet.address, false),
        contractRegistry.setContract("generalFeesWallet", generalFeesWallet.address, true),
        contractRegistry.setContract("certifiedFeesWallet", certifiedFeesWallet.address, true),
        contractRegistry.setContract("stakingContractHandler", stakingContractHandler.address, true),
    ]);

    await protocol.createDeploymentSubset(DEPLOYMENT_SUBSET_MAIN, 1);
    await protocol.createDeploymentSubset(DEPLOYMENT_SUBSET_CANARY, 1);

    const subscriber = await web3.deploy('MonthlySubscriptionPlan', [contractRegistry.address, registryAdmin, config.orbsTokenAddress, config.subscriptionTier, config.subscriptionRate]);
    await subscriptions.addSubscriber(subscriber.address);

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
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);