const fs = require('fs');
const readline = require("readline");

const stakingContractAddress = "0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3";
const stakingContractABI = JSON.parse("[{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_cooldownPeriodInSec\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_migrationManager\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_emergencyManager\",\"type\":\"address\"},{\"internalType\":\"contract IERC20\",\"name\":\"_token\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"stakeOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"totalStakedAmount\",\"type\":\"uint256\"}],\"name\":\"AcceptedMigration\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"emergencyManager\",\"type\":\"address\"}],\"name\":\"EmergencyManagerUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"stakeOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"totalStakedAmount\",\"type\":\"uint256\"}],\"name\":\"MigratedStake\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"contract IMigratableStakingContract\",\"name\":\"stakingContract\",\"type\":\"address\"}],\"name\":\"MigrationDestinationAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"contract IMigratableStakingContract\",\"name\":\"stakingContract\",\"type\":\"address\"}],\"name\":\"MigrationDestinationRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"migrationManager\",\"type\":\"address\"}],\"name\":\"MigrationManagerUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[],\"name\":\"ReleasedAllStakes\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"stakeOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"totalStakedAmount\",\"type\":\"uint256\"}],\"name\":\"Restaked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"contract IStakeChangeNotifier\",\"name\":\"notifier\",\"type\":\"address\"}],\"name\":\"StakeChangeNotifierUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"stakeOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"totalStakedAmount\",\"type\":\"uint256\"}],\"name\":\"Staked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[],\"name\":\"StoppedAcceptingNewStake\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"stakeOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"totalStakedAmount\",\"type\":\"uint256\"}],\"name\":\"Unstaked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"stakeOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"totalStakedAmount\",\"type\":\"uint256\"}],\"name\":\"Withdrew\",\"type\":\"event\"},{\"constant\":true,\"inputs\":[],\"name\":\"MAX_APPROVED_STAKING_CONTRACTS\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"VERSION\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakeOwner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"acceptMigration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"acceptingNewStakes\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"contract IMigratableStakingContract\",\"name\":\"_newStakingContract\",\"type\":\"address\"}],\"name\":\"addMigrationDestination\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"approvedStakingContracts\",\"outputs\":[{\"internalType\":\"contract IMigratableStakingContract\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"cooldownPeriodInSec\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_totalAmount\",\"type\":\"uint256\"},{\"internalType\":\"address[]\",\"name\":\"_stakeOwners\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"_amounts\",\"type\":\"uint256[]\"}],\"name\":\"distributeRewards\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"emergencyManager\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakeOwner\",\"type\":\"address\"}],\"name\":\"getStakeBalanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getToken\",\"outputs\":[{\"internalType\":\"contract IERC20\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getTotalStakedTokens\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakeOwner\",\"type\":\"address\"}],\"name\":\"getUnstakeStatus\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"cooldownAmount\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"cooldownEndTime\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"contract IMigratableStakingContract\",\"name\":\"_stakingContract\",\"type\":\"address\"}],\"name\":\"isApprovedStakingContract\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"exists\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"contract IMigratableStakingContract\",\"name\":\"_newStakingContract\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"migrateStakedTokens\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"migrationManager\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"notifier\",\"outputs\":[{\"internalType\":\"contract IStakeChangeNotifier\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"releaseAllStakes\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"releasingAllStakes\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"contract IMigratableStakingContract\",\"name\":\"_stakingContract\",\"type\":\"address\"}],\"name\":\"removeMigrationDestination\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"restake\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_newEmergencyManager\",\"type\":\"address\"}],\"name\":\"setEmergencyManager\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_newMigrationManager\",\"type\":\"address\"}],\"name\":\"setMigrationManager\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"contract IStakeChangeNotifier\",\"name\":\"_newNotifier\",\"type\":\"address\"}],\"name\":\"setStakeChangeNotifier\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"stake\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"stopAcceptingNewStakes\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"unstake\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"withdraw\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"_stakeOwners\",\"type\":\"address[]\"}],\"name\":\"withdrawReleasedStakes\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]");
const stakingContract = new web3.eth.Contract(stakingContractABI, stakingContractAddress);

const delegationsContractAddress = "0xBb5B5E9333e155cad6fe299B18dED3F4107EF294";
const delegationsContractABI = JSON.parse("[{\"inputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"name\":\"ContractRegistryAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"}],\"name\":\"Delegated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"selfDelegatedStake\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"delegatedStake\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"address[]\",\"name\":\"delegators\",\"type\":\"address[]\"},{\"indexed\":false,\"internalType\":\"uint256[]\",\"name\":\"delegatorTotalStakes\",\"type\":\"uint256[]\"}],\"name\":\"DelegatedStakeChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[],\"name\":\"DelegationImportFinalized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address[]\",\"name\":\"from\",\"type\":\"address[]\"},{\"indexed\":false,\"internalType\":\"address[]\",\"name\":\"to\",\"type\":\"address[]\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"notifiedElections\",\"type\":\"bool\"}],\"name\":\"DelegationsImported\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousFunctionalOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newFunctionalOwner\",\"type\":\"address\"}],\"name\":\"FunctionalOwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[],\"name\":\"Locked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousMigrationOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newMigrationOwner\",\"type\":\"address\"}],\"name\":\"MigrationOwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[],\"name\":\"Unlocked\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[],\"name\":\"claimFunctionalOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"claimMigrationOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"}],\"name\":\"delegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"delegationImportFinalized\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"finalizeDelegationImport\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"functionalOwner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getBootstrapRewardsWallet\",\"outputs\":[{\"internalType\":\"contract IProtocolWallet\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getCertificationContract\",\"outputs\":[{\"internalType\":\"contract ICertification\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getCommitteeContract\",\"outputs\":[{\"internalType\":\"contract ICommittee\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"name\":\"getDelegatedStakes\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"name\":\"getDelegation\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getDelegationsContract\",\"outputs\":[{\"internalType\":\"contract IDelegations\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getElectionsContract\",\"outputs\":[{\"internalType\":\"contract IElections\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGuardiansRegistrationContract\",\"outputs\":[{\"internalType\":\"contract IGuardiansRegistration\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getProtocolContract\",\"outputs\":[{\"internalType\":\"contract IProtocol\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getRewardsContract\",\"outputs\":[{\"internalType\":\"contract IRewards\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"name\":\"getSelfDelegatedStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getStakingContract\",\"outputs\":[{\"internalType\":\"contract IStakingContract\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getStakingRewardsWallet\",\"outputs\":[{\"internalType\":\"contract IProtocolWallet\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getSubscriptionsContract\",\"outputs\":[{\"internalType\":\"contract ISubscriptions\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getTotalDelegatedStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"from\",\"type\":\"address[]\"},{\"internalType\":\"address[]\",\"name\":\"to\",\"type\":\"address[]\"},{\"internalType\":\"bool\",\"name\":\"notifyElections\",\"type\":\"bool\"}],\"name\":\"importDelegations\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"isFunctionalOwner\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"isMigrationOwner\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"lock\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"locked\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"migrationOwner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"name\":\"refreshStakeNotification\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"renounceFunctionalOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"renounceMigrationOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"contract IContractRegistry\",\"name\":\"_contractRegistry\",\"type\":\"address\"}],\"name\":\"setContractRegistry\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakeOwner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"_sign\",\"type\":\"bool\"},{\"internalType\":\"uint256\",\"name\":\"_updatedStake\",\"type\":\"uint256\"}],\"name\":\"stakeChange\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"_stakeOwners\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"_amounts\",\"type\":\"uint256[]\"},{\"internalType\":\"bool[]\",\"name\":\"_signs\",\"type\":\"bool[]\"},{\"internalType\":\"uint256[]\",\"name\":\"_updatedStakes\",\"type\":\"uint256[]\"}],\"name\":\"stakeChangeBatch\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakeOwner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"stakeMigration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"newFunctionalOwner\",\"type\":\"address\"}],\"name\":\"transferFunctionalOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"newMigrationOwner\",\"type\":\"address\"}],\"name\":\"transferMigrationOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"unlock\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]");
const delegationsContract = new web3.eth.Contract(delegationsContractABI, delegationsContractAddress);

const v1DelegationsContractAddress = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d";
const v1DelegationsContractABI = JSON.parse("[{\"constant\":true,\"inputs\":[{\"name\":\"delegator\",\"type\":\"address\"}],\"name\":\"getCurrentDelegation\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"to\",\"type\":\"address\"}],\"name\":\"delegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"undelegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"guardian\",\"type\":\"address\"}],\"name\":\"getCurrentVote\",\"outputs\":[{\"name\":\"validators\",\"type\":\"address[]\"},{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"maxVoteOutCount\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"guardian\",\"type\":\"address\"}],\"name\":\"getCurrentVoteBytes20\",\"outputs\":[{\"name\":\"validatorsBytes20\",\"type\":\"bytes20[]\"},{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"validators\",\"type\":\"address[]\"}],\"name\":\"voteOut\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"VERSION\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"name\":\"maxVoteOutCount_\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"voter\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"validators\",\"type\":\"address[]\"},{\"indexed\":false,\"name\":\"voteCounter\",\"type\":\"uint256\"}],\"name\":\"VoteOut\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"delegator\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"delegationCounter\",\"type\":\"uint256\"}],\"name\":\"Delegate\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"delegator\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"delegationCounter\",\"type\":\"uint256\"}],\"name\":\"Undelegate\",\"type\":\"event\"}]");
const v1DelegationsContract = new web3.eth.Contract(v1DelegationsContractABI, v1DelegationsContractAddress);

const guardiansMigrationV1V2ContractAddress = "0x0000000000000000000000000000000000000000";
const guardiansMigrationV1V2ABI = JSON.parse("[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"oldGuardianAddress\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newGuardianAddress\",\"type\":\"address\"}],\"name\":\"GuardianAddressMigrationRecorded\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"name\":\"setNewGuardianAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"oldAddress\",\"type\":\"address\"}],\"name\":\"getGuardianV2Address\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"oldAddresses\",\"type\":\"address[]\"}],\"name\":\"getGuardiansV2AddressBatch\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"newAddresses\",\"type\":\"address[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]");
const guardiansMigrationV1V2Contract = new web3.eth.Contract(guardiansMigrationV1V2ABI, guardiansMigrationV1V2ContractAddress);

const hasGuardianMigrations = guardiansMigrationV1V2ContractAddress && guardiansMigrationV1V2ContractAddress.replace(/[0x]/g, "").length > 0;

const maxBatchSize = 50;
const gasLimitTx = 10000000;

const stakersBlacklist = ["0x553C3781677a2185d4ea9C8EEFBE971F03ad1417"]; // ignore these stakers

module.exports = async function(callback) {
    try {
        await migrate();
    } catch (e) {
        console.error(e)
    }
    callback();
};

async function loadMigrationSnapshot() {
    const snapshotFilename = "./migrationSnapshot.json";
    if (fs.existsSync(snapshotFilename) && await promptFileLoad()) {
        return JSON.parse(fs.readFileSync(snapshotFilename).toString());
    }

    const {stakers, identityMigration} = await _populateStakersAndIdentityMigration();
    // populate migration op arrays
    const importDelegations = [];
    const refreshStake = [];
    const refreshStakeNotifications = [];

    for (let s of stakers) {
        const op = await _checkDelegator(s, identityMigration);
        if (op && op.importDelegations) {
            importDelegations.push(op.importDelegations);
            if (!refreshStakeNotifications.includes(op.importDelegations.to)) {
                refreshStakeNotifications.push(op.importDelegations.to);
            }
        }
        if (op && op.refreshStake) {
            refreshStake.push(op.refreshStake);
        }
        console.log('processed', s);
    }

    const snapshot = {importDelegations, refreshStake, refreshStakeNotifications};
    if (fs.existsSync(snapshotFilename)) {
        fs.unlinkSync(snapshotFilename);
    }
    fs.writeFileSync(snapshotFilename, JSON.stringify(snapshot, null, 2));
    return snapshot;
}

async function migrate() {
    const migrationOwner = await callWithRetry(delegationsContract.methods.migrationOwner());
    if (!(await web3.eth.getAccounts()).includes(migrationOwner)) {
        throw "Migration owner is not a known account. Check mnemonic and retry...";
    }
    const startTime = new Date().getTime();

    const {importDelegations, refreshStake, refreshStakeNotifications} = await loadMigrationSnapshot();

    const batched = await _batchAndOptimizeImportDelegations(importDelegations, migrationOwner);

    // import delegation transactions
    const gasEstimates = [];
    for (const b of batched) {
        const gas = await delegationsContract.methods.importDelegations(b.from, b.to, false).estimateGas({from: migrationOwner});
        gasEstimates.push({gas, method: "importDelegations"});
        console.log(`Delegations.importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)}, false)`);
    }

    // refreshStakeNotification transactions
    for (const addr of refreshStakeNotifications) {
        const gas = await delegationsContract.methods.refreshStakeNotification(addr).estimateGas();
        gasEstimates.push({gas, method: "refreshStakeNotification"});
        console.log(`Delegations.refreshStakeNotification(${addr})`);
    }

    // refresh stake transactions
    for (const r of refreshStake) {
        const gas = await delegationsContract.methods.refreshStake(r.addr).estimateGas();
        gasEstimates.push({gas, method: "refreshStake"});
        console.log(`Delegations.refreshStake(${r.addr})`);

        // TODO remove
        throw "This should not happen as long as we use importDelegations instead";
    }

    console.log(JSON.stringify(gasEstimates, null, 2));

    const maxGas = gasEstimates.reduce((max, ge) => Math.max(max, ge.gas), 0);
    const totalGas = gasEstimates.reduce((sum, ge) => sum + ge.gas, 0);
    const gasPriceSuggest = await web3.eth.getGasPrice();
    const gasPriceSuggestGwei = web3.utils.fromWei(gasPriceSuggest, "gwei");
    const gasPriceSuggestEth = web3.utils.fromWei(gasPriceSuggest, "ether");
    const totalPriceEth = gasPriceSuggestEth * totalGas;

    console.log("execution time", (new Date().getTime() - startTime) / 1000 / 60, "min");
    console.log(`${batched.length} import batches of size: ${JSON.stringify(batched.map(b=>b.len))}`);
    console.log(`Estimated total gas is ${totalGas}, with the max tx consuming ${maxGas}.`);
    console.log(`Gas price is ${gasPriceSuggestGwei} (gwei), estimated costs are ${totalPriceEth} ETH`);

    const {proceed, gasPriceGwei} = await prompt(Math.trunc(gasPriceSuggestGwei));

    console.log(proceed, gasPriceGwei);
    // TODO send txes - apply gas price, from address, gas limit,
}

async function _populateStakersAndIdentityMigration() {

    const events = await stakingContract.getPastEvents("Staked", {fromBlock: 0, toBlock: "latest"});
    const unique = {};
    events.map(e => {
        if (!stakersBlacklist.includes(e.returnValues.stakeOwner)) {
            unique[e.returnValues.stakeOwner] = true;
        }
    });

    const stakers = Object.keys(unique);
    let identityMigration = {};

    if (hasGuardianMigrations) {
        identityMigration = await callWithRetry(guardiansMigrationV1V2Contract.getGuardiansV2AddressBatch(stakers))
            .reduce((m, newAddress, i)=> {
                m[stakers[i]] = newAddress;
                return m
                },
            {});
    } else {
        identityMigration = stakers
            .reduce((m, newAddress)=> {
                    m[newAddress] = newAddress;
                    return m
                },
            {});
    }
    return {stakers, identityMigration};

}

async function _checkDelegator(delegator, delegatesMigratedIdentity) {
    const v2Delegation = await callWithRetry(delegationsContract.methods.getDelegation(delegator));

    let v1DelegationV1Identity = await callWithRetry(v1DelegationsContract.methods.getCurrentDelegation(delegator));
    if (v1DelegationV1Identity === "0x0000000000000000000000000000000000000000") {
        v1DelegationV1Identity = delegator;
    }
    const v1Delegation = delegatesMigratedIdentity[v1DelegationV1Identity] || v1DelegationV1Identity;

    if (v1Delegation !== v2Delegation) {
        return {
            importDelegations: {from: delegator, to: v1Delegation}
        };
    }

    // if we dont import delegations check if need to update stake:
    let scb = await callWithRetry(stakingContract.methods.getStakeBalanceOf(delegator));
    let dcb = await callWithRetry(delegationsContract.methods.getDelegatedStakes(delegator));

    if (dcb !== scb) {
        return { // TODO - TBD - when new contracts are deployed use refreshStake instead of importDelegations
            importDelegations: {from: delegator, to: v2Delegation}
            // refreshStake: {addr: delegator}
        }
    }
}

async function _batchImportDelegationTransactions(sorted, batchSize, migrationOwner) {

    const batched = sorted.reduce((batchedArr, delegationItem, i)=>{
        const bi = Math.trunc(i / batchSize);
        batchedArr[bi] = batchedArr[bi] || {from: [], to: [], len: 0};
        batchedArr[bi].to.push(delegationItem.to);
        batchedArr[bi].from.push(delegationItem.from);
        batchedArr[bi].len++;
    }, []);

    console.log(`splitting to batches of ${batchSize}`);

    // gas estimate that batches are small enough to pass
    for (const i in batched) {
        const b = batched[i];
        try{
            const gas = await delegationsContract.methods.importDelegations(b.from, b.to, false).estimateGas({from: migrationOwner});

            if (gas > gasLimitTx) {
                if (batchSize > 1) {
                    return await _batchImportDelegationTransactions(sorted, batchSize - 1, migrationOwner);
                }
                console.log(`gas cost: ${gas} for: importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)}, false)`);
                throw "smallest batch exceeds gas limit"
            }
            console.log(`batch ${i} gas estimate passed, for batch size ${batchSize}`)
        } catch (e) {
            if (e.code && e.code === -32000 && batchSize > 1) {
                return await _batchImportDelegationTransactions(sorted, batchSize - 1, migrationOwner);
            }
            console.log(`smallest batch failed: ${JSON.stringify(e)}`);
            console.log(`failed to estimate gas for: importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)}, false)`);
            throw e;
        }
    }

    return batched;
}

async function _batchAndOptimizeImportDelegations(importDelegations, migrationOwner) {
    if (!importDelegations || !importDelegations.length) {
        return [];
    }


    const sorted = importDelegations.sort((a,b) => {
        if (a.to < b.to) return -1;
        if (a.to > b.to) return 1;
        return 0;
    } );

    return await _batchImportDelegationTransactions(sorted, maxBatchSize, migrationOwner);
}

async function callWithRetry(method, options) {
    let err;
    let count = 0;
    while (count <=5 ) {
        try {
            return method.call(options);
        } catch (e) {
            count++;
            err = e;
            await sleep(1000);
        }
    }
    throw err;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function prompt(gasPriceSuggestGwei) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return await new Promise(async (resolutionFunc) => {
        let gasPrice = gasPriceSuggestGwei;
        const gasPriceCallback = function (answer) {
            const newPrice = parseInt(answer);

            if (answer === "") { // default selected
                rl.question("Proceed with migration? [Yes/No] ", confirmCallback);

            } else if (isNaN(newPrice) || newPrice <= 0) { // invalid

                rl.question(`Please specify a positive integer.\nOverride gas price? [${gasPrice}] `, gasPriceCallback);

            } else { // overriden

                gasPrice = newPrice;
                rl.question("Proceed with migration? [Yes/No] ", confirmCallback);

            }
        };

        const confirmCallback = function (answer) {
            switch (answer.toLowerCase()) {
                case "yes":
                case "y":
                    resolutionFunc({proceed: true, gasPriceGwei: gasPrice});
                    rl.close();
                    break;
                case "no":
                case "n":
                    resolutionFunc({proceed: false, gasPriceGwei: gasPrice});
                    rl.close();
                    break;
                default:
                    rl.question("Proceed with migration? [Yes/No] ", confirmCallback);
            }
        };
        rl.question(`Override gas price? [${gasPrice}] `, gasPriceCallback);
    });
}

async function promptFileLoad() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return await new Promise(async (resolutionFunc) => {
        const queryString = "Found a snapshot file. Load migration snapshot from file? [Load/Override] ";
        const confirmCallback = function (answer) {
            switch (answer.toLowerCase()) {
                case "l":
                case "load":
                    resolutionFunc(true);
                    rl.close();
                    break;
                case "o":
                case "override":
                    resolutionFunc(false);
                    rl.close();
                    break;
                default:

                    rl.question(query, confirmCallback);
            }
        };
        rl.question(queryString, confirmCallback);
    });
}
