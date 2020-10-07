const fs = require('fs');
const readline = require("readline");
const { getPastEventsFromMainnet } = require('./mainnet_event_fetcher');
const cntr = {};

// const hasGuardianMigrations = guardiansMigrationV1V2ContractAddress && guardiansMigrationV1V2ContractAddress.replace(/[0x]/g, "").length > 0;

const maxBatchSize = 50;
const gasLimitTx = 10000000;

// addresses used internally by dev are not migrated
const TEAM_WALLET_ADDRESS = "0xC200f98F3C088B868D80d8eb0aeb9D7eE18d604B";
const VOID_DELEGATION     = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
const DEV_TEST_ADDRESS    = "0x553C3781677a2185d4ea9C8EEFBE971F03ad1417";
const stakersBlacklist    = [DEV_TEST_ADDRESS, TEAM_WALLET_ADDRESS];

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
const transferEventAbi = {
    "anonymous": false,
    "inputs": [
        {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
        },
        {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
        },
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
        }
    ],
    "name": "Transfer",
    "type": "event"
};

module.exports = async function(callback) {
    try {
        cntr.contractRegistry = new web3.eth.Contract(contractRegistryAbi, contractRegistryAddress);
        const delegationsContractAddress = await callWithRetry(cntr.contractRegistry.methods.getContract('delegations'));

        cntr.delegations = new web3.eth.Contract(delegationsContractAbi, delegationsContractAddress);
        cntr.staking = new web3.eth.Contract(stakingContractAbi, stakingContractAddress);
        cntr.stakingAbi = stakingContractAbi;
        cntr.v1Delegations = new web3.eth.Contract(v1DelegationsContractAbi, v1DelegationsContractAddress);
        cntr.guardiansMigration = new web3.eth.Contract(guardiansMigrationV1V2Abi, guardiansMigrationV1V2ContractAddress);

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

    // initialize team wallet delegation:
    importDelegations.push({from: TEAM_WALLET_ADDRESS, to: VOID_DELEGATION});

    // first topic is the from address
    const implicitDelegations = [];

    for (let s of stakers) {
        const op = await _checkDelegator(s, identityMigration);
        if (op.importDelegations) {
            importDelegations.push(op.importDelegations);
            if (!refreshStake.includes(op.importDelegations.to)) {
                refreshStake.push(op.importDelegations.to);
            }
        }
        if (op.refreshStake) {
            refreshStake.push(op.refreshStake);
        }
        console.log('processed', s);
    }

    const snapshot = {importDelegations, refreshStake};
    if (fs.existsSync(snapshotFilename)) {
        fs.unlinkSync(snapshotFilename);
    }
    fs.writeFileSync(snapshotFilename, JSON.stringify(snapshot, null, 2));
    return snapshot;
}

async function migrate() {
    const migrationManager = await callWithRetry(cntr.contractRegistry.methods.getManager("migrationManager"));
    if (!(await web3.eth.getAccounts()).includes(migrationManager)) {
        throw "Migration owner is not a known account. Check mnemonic and retry...";
    }
    const startTime = new Date().getTime();

    const {importDelegations, refreshStake} = await loadMigrationSnapshot();

    const batched = await _batchAndOptimizeImportDelegations(importDelegations, migrationManager);

    // import delegation transactions
    const gasEstimates = [];
    for (const b of batched) {
        const gas = await cntr.delegations.methods.importDelegations(b.from, b.to, false).estimateGas({from: migrationManager});
        gasEstimates.push({gas, method: "importDelegations"});
        console.log(`Delegations.importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)}, false)`);
    }

    // refresh stake transactions
    for (const r of refreshStake) {
        const gas = await cntr.delegations.methods.refreshStake(r).estimateGas();
        gasEstimates.push({gas, method: "refreshStake"});
        console.log(`Delegations.refreshStake(${r})`);

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

    if (!proceed) {
        console.log('Aborting..');
        return;
    }


    // TODO send txes - apply gas price, from address, gas limit,
    console.log('TODO - send transactions here.... coming soon :(')
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

    const identityMigration = (await callWithRetry(cntr.guardiansMigration.methods.getGuardiansV2AddressBatch(stakers)))
        .reduce((m, newAddress, i)=> {
            m[stakers[i]] = newAddress;
            return m
            },
        {});
    return {stakers, identityMigration};
}

async function _checkDelegator(delegator, delegatesMigratedIdentity) {
    const v2Delegation = await callWithRetry(cntr.delegations.methods.getDelegation(delegator));

    let v1DelegationV1Identity = await callWithRetry(cntr.v1Delegations.methods.getCurrentDelegation(delegator));
    if (v1DelegationV1Identity === "0x0000000000000000000000000000000000000000") {
        const implicitDelegation = (await getPastEventsFromMainnet([transferEventAbi], orbsTokenAddress, 'Transfer', [`0x${'0'.repeat(24)}${delegator.slice(2)}`]))
            .filter(t => t.value === '70000000000000000' ).pop();
        if (implicitDelegation) {
            v1DelegationV1Identity = implicitDelegation.to;
        } else {
            v1DelegationV1Identity = delegator;
        }
    }
    const v1Delegation = delegatesMigratedIdentity[v1DelegationV1Identity] || v1DelegationV1Identity;

    if (v1Delegation !== v2Delegation && v1Delegation != delegator) { // we don't do self delegations!!
        return {
            importDelegations: {from: delegator, to: v1Delegation}
        };
    }

    // if we dont import delegations check if need to update stake:
    let scb = await callWithRetry(cntr.staking.methods.getStakeBalanceOf(delegator));
    let dcb = await callWithRetry(cntr.delegations.methods.getDelegatedStake(delegator));

    if (dcb !== scb) {
        return {
            refreshStake: delegator
        }
    }
    return {}
}

async function _batchImportDelegationTransactions(sorted, batchSize, migrationOwner) {

    const batches = sorted.reduce((batchedArr, delegationItem)=>{
        const prevBatch = batchedArr.length ? batchedArr[batchedArr.length - 1] : undefined;
        if (prevBatch === undefined || prevBatch.len >= batchSize || prevBatch.to !== delegationItem.to) {
            batchedArr.push({from: [], to: delegationItem.to, len: 0})
        }
        const currentBatch = batchedArr[batchedArr.length - 1];
        currentBatch.from.push(delegationItem.from);
        currentBatch.len++;
        return batchedArr;
    }, []);

    console.log(`splitting to batches of ${batchSize}`);

    // gas estimate that batches are small enough to pass
    for (const i in batches) {
        const b = batches[i];
        try{
            const gas = await cntr.delegations.methods.importDelegations(b.from, b.to, false).estimateGas({from: migrationOwner});

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
                    rl.question(queryString, confirmCallback);
            }
        };
        rl.question(queryString, confirmCallback);
    });
}
