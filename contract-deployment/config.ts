import {bn, tokens} from "./helpers";
import BigNumber from 'bignumber.js';


export const config = {
    // Committee
    maxCommitteeSize: 22,

    // Elections
    minSelfStakePercentMille : 0,
    voteUnreadyThresholdPercentMille : 70 * 1000,
    voteOutThresholdPercentMille : 70 * 1000,

    // Rewards
    generalCommitteeAnnualBootstrap: tokens(0),
    certifiedCommitteeAnnualBootstrap: tokens(3000),
    stakingRewardsAnnualRateInPercentMille: 10000,
    stakingRewardsAnnualCap: new BigNumber('0xffffffffffffffffffffffff'), // 2**96-1
    defaultDelegatorsStakingRewardsPercentMille: 66667,
    maxDelegatorsStakingRewardsPercentMille: 66667,

    // Protocol wallets
    stakingRewardsWalletRate: tokens(200_000_000), // staking rewards for entire committee + 10%
    bootstrapRewardsWalletRate: tokens(3000).mul(bn(22)), // bootstrap rewards for both certified and general, for entire committee

    // Subscription plan
    subscriptionTier: "tier1",
    subscriptionRate: new BigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), // 2 ** 256-1

    // Subscriptions
    genesisRefTimeDelay: bn(3*60*60),
    nextVcId: bn(1000005),

    orbsTokenAddress: "0x614389EaAE0A6821DC49062D56BDA3d9d45Fa2ff",
    bootstrapTokenAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    stakingContractAddress: "0x",

    minimumInitialVcPayment: new BigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), // 2 ** 256-1 // tokens(21_000).mul(bn(6)), // 6 times the rate

    registryAdminAddress: "0xf1fD5233E60E7Ef797025FE9DD066d60d59BcB92",
    migrationManager: "0xb7d1068f267aB092973108f0F8CD914830cC1795",
    emergencyManager: "0xb7d1068f267aB092973108f0F8CD914830cC1795",
    cooldownPeriodInSec: 1209600,

};

export const chainId = parseInt(process.env.CHAN_ID || '1')
