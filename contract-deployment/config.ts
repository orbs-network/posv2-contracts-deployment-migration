import {bn} from "./helpers";

export const config = {
    // Committee
    maxCommitteeSize: 22,

    // Elections
    minSelfStakePercentMille : 8000,
    voteUnreadyThresholdPercentMille : 70 * 1000,
    voteOutThresholdPercentMille : 70 * 1000,

    // Rewards
    generalCommitteeAnnualBootstrap: bn(12).mul(bn(10).pow(bn(18))),
    certifiedCommitteeAnnualBootstrap: bn(6).mul(bn(10).pow(bn(18))),
    stakingRewardsAnnualRateInPercentMille: 12000,
    stakingRewardsAnnualCap: bn(12000).mul(bn(10).pow(bn(18))),
    defaultDelegatorsStakingRewardsPercentMille: 66667,
    maxDelegatorsStakingRewardsPercentMille: 66667,

    // Protocol wallets
    stakingRewardsWalletRate: bn(12000).mul(bn(10).pow(bn(18))), // staking rewards for entire committee + 10%
    bootstrapRewardsWalletRate: bn((12 + 6) * 22).mul(bn(10).pow(bn(18))), // bootstrap rewards for both certified and general, for entire committee + 10%

    // Subscription plan
    subscriptionTier: "beta1",
    subscriptionRate: bn(100).mul(bn(10).pow(bn(18))),

    // Subscriptions
    genesisRefTimeDelay: bn(3*60*60),
    nextVcId: bn(1000003),

    orbsTokenAddress: "0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA",
    bootstrapTokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
    stakingContractAddress: "0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3",

    previousGuardianRegistrationContractAddr: "0xd095e7310616376BDeD74Afc7e0400E6d0894E6F",

    existingContractsToLock: [
        "0xdA393f62303Ce1396D6F425cd7e85b60DaC8233e", // elections
        "0x3b2C72d0D5FC8A7346091f449487CD0A7F0954d6", // subscriptions
        "0xF6Cc041e1bb8C1431D419Bb88424324Af5Dd7866", // protocol
        "0x47c4AE9ceFb30AFBA85da9c2Fcd3125480770D9b", // certification
        "0xd095e7310616376BDeD74Afc7e0400E6d0894E6F", // registration
        "0xBFB2bAC25daAabf79e5c94A8036b28c553ee75F5", // committee
        "0x16De66Ca1135a997f17679c0CdF09d49223F5B20", // rewards
        "0xBb5B5E9333e155cad6fe299B18dED3F4107EF294", // delegations
    ],

    previousCommitteeContractAddress: "0xBFB2bAC25daAabf79e5c94A8036b28c553ee75F5",

    minimumInitialVcPayment: bn(100),
};
