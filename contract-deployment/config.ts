    import {bn, tokens} from "./helpers";

export const config = {
    // Committee
    maxCommitteeSize: 22,

    // Elections
    minSelfStakePercentMille : 8000,
    voteUnreadyThresholdPercentMille : 70 * 1000,
    voteOutThresholdPercentMille : 70 * 1000,

    // Rewards
    generalCommitteeAnnualBootstrap: tokens(0),
    certifiedCommitteeAnnualBootstrap: tokens(3000),
    stakingRewardsAnnualRateInPercentMille: 12000,
    stakingRewardsAnnualCap: tokens(80_000_000),
    defaultDelegatorsStakingRewardsPercentMille: 66667,
    maxDelegatorsStakingRewardsPercentMille: 66667,

    // Protocol wallets
    stakingRewardsWalletRate: tokens(8_000_000), // staking rewards for entire committee + 10%
    bootstrapRewardsWalletRate: tokens(300).mul(bn(22)), // bootstrap rewards for both certified and general, for entire committee

    // Subscription plan
    subscriptionTier: "tier1",
    subscriptionRate: tokens(21_000),

    // Subscriptions
    genesisRefTimeDelay: bn(3*60*60),
    nextVcId: bn(1000005),

    orbsTokenAddress: "0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA",
    bootstrapTokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
    stakingContractAddress: "0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3",

    minimumInitialVcPayment: tokens(21_000).mul(bn(6)), // 6 times the rate

    registryAdminAddress: "0xf1fD5233E60E7Ef797025FE9DD066d60d59BcB92",
};
