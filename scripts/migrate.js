const fs = require('fs');
const { getPastEventsFromMainnet } = require('./mainnet_event_fetcher');
const { promptGasPriceGwei, promptFileLoad } = require("./prompt");

const snapshotFilename = "./migrationSnapshot.json";

const maxBatchSize = 50;
const gasLimitTx = 10000000;

// addresses used internally by dev are not migrated
const TEAM_WALLET_ADDRESS = "0xC200f98F3C088B868D80d8eb0aeb9D7eE18d604B";
const VOID_DELEGATION     = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
const DEV_TEST_ADDRESS    = "0x553C3781677a2185d4ea9C8EEFBE971F03ad1417";
const stakersBlacklist    = [DEV_TEST_ADDRESS, TEAM_WALLET_ADDRESS];

// contracts
const contractRegistryAddress = JSON.parse(fs.readFileSync("../driverOptions.json")).contractRegistryForExistingContractsAddress;
const contractRegistryAbi = JSON.parse(fs.readFileSync("../node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/abi/ContractRegistry.abi"));
const delegationsContractAbi = JSON.parse(fs.readFileSync("../node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/abi/IDelegations.abi"));
const stakingContractAddress = "0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3";
const stakingContractAbi = JSON.parse(fs.readFileSync("../node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/abi/IStakingContract.abi"));
const v1DelegationsContractAddress = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d";
const v1DelegationsContractAbi = JSON.parse("[{\"constant\":true,\"inputs\":[{\"name\":\"delegator\",\"type\":\"address\"}],\"name\":\"getCurrentDelegation\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"to\",\"type\":\"address\"}],\"name\":\"delegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"undelegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"guardian\",\"type\":\"address\"}],\"name\":\"getCurrentVote\",\"outputs\":[{\"name\":\"validators\",\"type\":\"address[]\"},{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"maxVoteOutCount\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"guardian\",\"type\":\"address\"}],\"name\":\"getCurrentVoteBytes20\",\"outputs\":[{\"name\":\"validatorsBytes20\",\"type\":\"bytes20[]\"},{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"validators\",\"type\":\"address[]\"}],\"name\":\"voteOut\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"VERSION\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"name\":\"maxVoteOutCount_\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"voter\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"validators\",\"type\":\"address[]\"},{\"indexed\":false,\"name\":\"voteCounter\",\"type\":\"uint256\"}],\"name\":\"VoteOut\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"delegator\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"delegationCounter\",\"type\":\"uint256\"}],\"name\":\"Delegate\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"delegator\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"delegationCounter\",\"type\":\"uint256\"}],\"name\":\"Undelegate\",\"type\":\"event\"}]");
const guardiansMigrationV1V2ContractAddress = "0xd2abc20b2a7bfdf4c7e126a669d2c43293845c7d";
const guardiansMigrationV1V2Abi = JSON.parse("[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"oldGuardianAddress\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newGuardianAddress\",\"type\":\"address\"}],\"name\":\"GuardianAddressMigrationRecorded\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"name\":\"setNewGuardianAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"oldAddress\",\"type\":\"address\"}],\"name\":\"getGuardianV2Address\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"oldAddresses\",\"type\":\"address[]\"}],\"name\":\"getGuardiansV2AddressBatch\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"newAddresses\",\"type\":\"address[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]");
const orbsTokenAddress = '0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa';
const erc20TransferEventAbi = JSON.parse("{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"}");

module.exports = async function(callback) {
    try {
        await initContractGlobals();
        await migrate();
    } catch (e) {
        console.error(e)
    }
    callback();
};

const cnts = {};
async function initContractGlobals() {
    cnts.contractRegistry = new web3.eth.Contract(contractRegistryAbi, contractRegistryAddress);
    const delegationsContractAddress = await callWithRetry(cnts.contractRegistry.methods.getContract('delegations'));

    cnts.delegations = new web3.eth.Contract(delegationsContractAbi, delegationsContractAddress);
    cnts.staking = new web3.eth.Contract(stakingContractAbi, stakingContractAddress);
    cnts.stakingAbi = stakingContractAbi;
    cnts.v1Delegations = new web3.eth.Contract(v1DelegationsContractAbi, v1DelegationsContractAddress);
    cnts.guardiansMigration = new web3.eth.Contract(guardiansMigrationV1V2Abi, guardiansMigrationV1V2ContractAddress);
}

async function migrate() {
    const migrationManager = await callWithRetry(cnts.contractRegistry.methods.getManager("migrationManager"));
    if (!(await web3.eth.getAccounts()).includes(migrationManager)) {
        throw "Migration owner is not a known account. Check mnemonic and retry...";
    }
    const startTime = new Date().getTime();

    const {importDelegations, refreshStake} = await loadMigrationSnapshot();

    const batched = await _batchAndOptimizeImportDelegations(importDelegations, migrationManager);

    // import delegation transactions
    const gasEstimates = [];
    for (const b of batched) {
        console.log(`Delegations.importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)})...`);
        const gas = await cnts.delegations.methods.importDelegations(b.from, b.to, false).estimateGas({from: migrationManager});
        gasEstimates.push({gas, method: "importDelegations"});
    }

    // refresh stake transactions
    for (const r of refreshStake) {
        console.log(`Delegations.refreshStake(${r.for}) // (${r.cause})...`);
        const gas = await cnts.delegations.methods.refreshStake(r.for).estimateGas();
        gasEstimates.push({gas, method: "refreshStake"});
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

    const {proceed, gasPriceGwei} = await promptGasPriceGwei(Math.trunc(gasPriceSuggestGwei));

    if (!proceed) {
        console.log('Aborting..');
        return;
    }


    // TODO send txes - apply gas price, from address, gas limit,
    console.log('TODO - send transactions here.... coming soon :(')
}

async function loadMigrationSnapshot() {
    if (fs.existsSync(snapshotFilename) && await promptFileLoad()) {
        return JSON.parse(fs.readFileSync(snapshotFilename).toString());
    }

    const snapshot = await _constructSnapshot();
    if (fs.existsSync(snapshotFilename)) {
        fs.unlinkSync(snapshotFilename);
    }
    fs.writeFileSync(snapshotFilename, JSON.stringify(snapshot, null, 2));
    return snapshot;
}

async function _constructSnapshot() {
// populate snapshot object
    const snapshot = {importDelegations: [], refreshStake: []};

    // initialize team wallet delegation:
    snapshot.importDelegations.push({from: TEAM_WALLET_ADDRESS, to: VOID_DELEGATION});

    const {stakers, identityMigration} = await _populateStakersAndIdentityMigration();
    for (let s of stakers) {
        const op = await _checkDelegator(s, identityMigration);
        if (op.importDelegations) {
            snapshot.importDelegations.push(op.importDelegations);
            _insertUniquely(snapshot.refreshStake, op.refreshStake, true);
        }
        _insertUniquely(snapshot.refreshStake, op.refreshStake, false);

        console.log('processed', s);
    }
    return snapshot;
}

async function _populateStakersAndIdentityMigration() {

    const events = await getPastEventsFromMainnet(stakingContractAbi, stakingContractAddress, "Staked");
    const unique = {};
    events.map(e => {
        if (!stakersBlacklist.includes(e.stakeOwner)) {
            unique[e.stakeOwner] = true;
        }
    });

    const stakers = Object.keys(unique);

    const identityMigration = (await callWithRetry(cnts.guardiansMigration.methods.getGuardiansV2AddressBatch(stakers)))
        .reduce((m, newAddress, i)=> {
            m[stakers[i]] = newAddress;
            return m
            },
        {});
    return {stakers, identityMigration};
}

async function _checkDelegator(delegator, delegatesMigratedIdentity) {

    const importDelegations = {};
    const explicitV1Delegation = await _checkV1ExplicitDelegation(delegator);
    if (explicitV1Delegation) {
        importDelegations.from = delegator;
        importDelegations.to = _translateGuardianIdentity(delegatesMigratedIdentity, explicitV1Delegation);
        importDelegations.cause = "explicitly delegated in v1";
    } else {
        const implicitV1Delegation = await _checkV1ImplicitDelegation(delegator);
        if (implicitV1Delegation) {
            importDelegations.from = delegator;
            importDelegations.to = _translateGuardianIdentity(delegatesMigratedIdentity, implicitV1Delegation);
            importDelegations.cause = "implicitly delegated in v1";
        }
    }
    const v2Delegation = await callWithRetry(cnts.delegations.methods.getDelegation(delegator));
    if (importDelegations.to &&
        importDelegations.to !== v2Delegation &&
        importDelegations.to !== delegator) { // self delegation is handled later by refreshStake
        return {
            importDelegations,
            refreshStake: {
                for: importDelegations.to,
                cause: "found at least one delegator"
            }
        }
    }

    // delegator self delegating (or V2 delegations contract is already aware of her delegation).
    // if someone else delegates to her - she will get a refreshStake entry in the code above.
    // Otherwise, her stake will not be refreshed by 'importDelegations', so:
    // we're only worried about the case where no one delegates to her, and she is not delegating to others.
    // therefore, we can ensure her self stake is identical to be her delegated stake.
    let stakedBalance = await callWithRetry(cnts.staking.methods.getStakeBalanceOf(delegator));
    let delegatedStake = await callWithRetry(cnts.delegations.methods.getDelegatedStake(delegator));

    if (delegatedStake !== stakedBalance) {
        return {
            refreshStake: {
                for: delegator,
                stakedBalance,
                delegatedStake,
                cause: "self delegating with potentially no delegations"
            }
        }
    }
    return {}
}

function _insertUniquely(refreshStakeArr, refreshStakeOp, replace) {
    if (refreshStakeOp === undefined) {
        return;
    }
    const existingIndex = refreshStakeArr.map(rs=>rs.for).indexOf(refreshStakeOp.for);
    if (existingIndex == -1) {
        refreshStakeArr.push(refreshStakeOp);
    } else if (replace) {
        refreshStakeArr[existingIndex] = refreshStakeOp;
    }
}

function _addressAsTopic(delegator) {
    return `0x${'0'.repeat(24)}${delegator.slice(2)}`;
}

async function _checkV1ExplicitDelegation(delegator) {
    let v1DelegationV1Identity = await callWithRetry(cnts.v1Delegations.methods.getCurrentDelegation(delegator));
    const explicitV1Delegation = v1DelegationV1Identity !== "0x0000000000000000000000000000000000000000";
    return explicitV1Delegation ? v1DelegationV1Identity : undefined;
}

async function _checkV1ImplicitDelegation(delegator) {
    const implicitV1Delegation = (await getPastEventsFromMainnet([erc20TransferEventAbi], orbsTokenAddress, 'Transfer', [(_addressAsTopic(delegator))]))
        .filter(t => t.value === '70000000000000000').pop();

    return implicitV1Delegation ? implicitV1Delegation.to : undefined;
}

function _translateGuardianIdentity(delegatesMigratedIdentity, v1DelegationV1Identity) {
    return delegatesMigratedIdentity[v1DelegationV1Identity] || v1DelegationV1Identity;
}

async function _batchImportDelegationTransactions(sorted, maxBatchSize, migrationOwner) {

    const batches = sorted.reduce((batchedArr, delegationItem)=>{
        const prevBatch = batchedArr.length ? batchedArr[batchedArr.length - 1] : undefined;
        if (prevBatch === undefined || prevBatch.len >= maxBatchSize || prevBatch.to !== delegationItem.to) {
            batchedArr.push({from: [], to: delegationItem.to, len: 0})
        }
        const currentBatch = batchedArr[batchedArr.length - 1];
        currentBatch.from.push(delegationItem.from);
        currentBatch.len++;
        return batchedArr;
    }, []);

    console.log(`splitting to batches of ${maxBatchSize}`);

    // gas estimate that batches are small enough to pass
    for (const i in batches) {
        const b = batches[i];
        try{
            const gas = await cnts.delegations.methods.importDelegations(b.from, b.to, false).estimateGas({from: migrationOwner});

            if (gas > gasLimitTx) {
                if (maxBatchSize > 1) {
                    return await _batchImportDelegationTransactions(sorted, maxBatchSize - 1, migrationOwner);
                }
                console.log(`gas cost: ${gas} for: importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)}, false)`);
                throw "smallest batch exceeds gas limit"
            }
            console.log(`batch ${i} gas estimate passed, for max batch size ${maxBatchSize}`)
        } catch (e) {
            if (e.code && e.code === -32000 && maxBatchSize > 1) {
                return await _batchImportDelegationTransactions(sorted, maxBatchSize - 1, migrationOwner);
            }
            console.log(`smallest batch failed: ${JSON.stringify(e)}`);
            console.log(`failed to estimate gas for: importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)}, false)`);
            throw e;
        }
    }

    return batches;
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

