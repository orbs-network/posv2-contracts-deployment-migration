const fs = require('fs');
const readline = require("readline");
const { getPastEventsFromMainnet } = require('./mainnet_event_fetcher');
const cntr = {};

// const hasGuardianMigrations = guardiansMigrationV1V2ContractAddress && guardiansMigrationV1V2ContractAddress.replace(/[0x]/g, "").length > 0;

const maxBatchSize = 50;
const gasLimitTx = 10000000;

// addresses used internally by dev are not migrated
const stakersBlacklist = ["0x553C3781677a2185d4ea9C8EEFBE971F03ad1417"];

module.exports = async function(callback) {
    try {
        const contractRegistryAddress = JSON.parse(fs.readFileSync("./driverOptions.json")).contractRegistryForExistingContractsAddress;
        const contractRegistryABI = JSON.parse(fs.readFileSync("./node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/abi/ContractRegistry.abi"));
        cntr.contractRegistry = new web3.eth.Contract(contractRegistryABI, contractRegistryAddress);

        const delegationsContractAddress = await callWithRetry(cntr.contractRegistry.methods.getContract('delegations'));
        const delegationsContractABI = JSON.parse(fs.readFileSync("./node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/abi/IDelegations.abi"));
        cntr.delegations = new web3.eth.Contract(delegationsContractABI, delegationsContractAddress);

        const stakingContractAddress = "0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3";
        const stakingContractABI = JSON.parse(fs.readFileSync("./node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/abi/IStakingContract.abi"));
        cntr.staking = new web3.eth.Contract(stakingContractABI, stakingContractAddress);

        const v1DelegationsContractAddress = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d";
        const v1DelegationsContractABI = JSON.parse("[{\"constant\":true,\"inputs\":[{\"name\":\"delegator\",\"type\":\"address\"}],\"name\":\"getCurrentDelegation\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"to\",\"type\":\"address\"}],\"name\":\"delegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"undelegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"guardian\",\"type\":\"address\"}],\"name\":\"getCurrentVote\",\"outputs\":[{\"name\":\"validators\",\"type\":\"address[]\"},{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"maxVoteOutCount\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"guardian\",\"type\":\"address\"}],\"name\":\"getCurrentVoteBytes20\",\"outputs\":[{\"name\":\"validatorsBytes20\",\"type\":\"bytes20[]\"},{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"validators\",\"type\":\"address[]\"}],\"name\":\"voteOut\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"VERSION\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"name\":\"maxVoteOutCount_\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"voter\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"validators\",\"type\":\"address[]\"},{\"indexed\":false,\"name\":\"voteCounter\",\"type\":\"uint256\"}],\"name\":\"VoteOut\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"delegator\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"delegationCounter\",\"type\":\"uint256\"}],\"name\":\"Delegate\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"delegator\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"delegationCounter\",\"type\":\"uint256\"}],\"name\":\"Undelegate\",\"type\":\"event\"}]");
        cntr.v1Delegations = new web3.eth.Contract(v1DelegationsContractABI, v1DelegationsContractAddress);

        const guardiansMigrationV1V2ContractAddress = "0xd2abc20b2a7bfdf4c7e126a669d2c43293845c7d";
        const guardiansMigrationV1V2ABI = JSON.parse("[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"oldGuardianAddress\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newGuardianAddress\",\"type\":\"address\"}],\"name\":\"GuardianAddressMigrationRecorded\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"name\":\"setNewGuardianAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"oldAddress\",\"type\":\"address\"}],\"name\":\"getGuardianV2Address\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"oldAddresses\",\"type\":\"address[]\"}],\"name\":\"getGuardiansV2AddressBatch\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"newAddresses\",\"type\":\"address[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]");
        cntr.guardiansMigration = new web3.eth.Contract(guardiansMigrationV1V2ABI, guardiansMigrationV1V2ContractAddress);

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
    const migrationManager = await callWithRetry(cntr.contractRegistry.methods.getManager("migrationManager")());
    if (!(await web3.eth.getAccounts()).includes(migrationManager)) {
        throw "Migration owner is not a known account. Check mnemonic and retry...";
    }
    const startTime = new Date().getTime();

    const {importDelegations, refreshStake, refreshStakeNotifications} = await loadMigrationSnapshot();

    const batched = await _batchAndOptimizeImportDelegations(importDelegations, migrationManager);

    // import delegation transactions
    const gasEstimates = [];
    for (const b of batched) {
        const gas = await cntr.delegations.methods.importDelegations(b.from, b.to, false).estimateGas({from: migrationManager});
        gasEstimates.push({gas, method: "importDelegations"});
        console.log(`Delegations.importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)}, false)`);
    }

    // refreshStakeNotification transactions
    for (const addr of refreshStakeNotifications) {
        const gas = await cntr.delegations.methods.refreshStakeNotification(addr).estimateGas();
        gasEstimates.push({gas, method: "refreshStakeNotification"});
        console.log(`Delegations.refreshStakeNotification(${addr})`);
    }

    // refresh stake transactions
    for (const r of refreshStake) {
        const gas = await cntr.delegations.methods.refreshStake(r.addr).estimateGas();
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

    if (!proceed) {
        console.log('Aborting..');
        return;
    }


    // TODO send txes - apply gas price, from address, gas limit,
    console.log('TODO - send transactions here.... coming soon :(')
}

async function _populateStakersAndIdentityMigration() {

    const events = await getPastEventsFromMainnet(staking);
    const unique = {};
    events.map(e => {
        if (!stakersBlacklist.includes(e.returnValues.stakeOwner)) {
            unique[e.returnValues.stakeOwner] = true;
        }
    });

    const stakers = Object.keys(unique);
    let identityMigration = {};

    // if (hasGuardianMigrations) {
        identityMigration = await callWithRetry(cntr.guardiansMigration.getGuardiansV2AddressBatch(stakers))
            .reduce((m, newAddress, i)=> {
                m[stakers[i]] = newAddress;
                return m
                },
            {});
    // } else {
    //     identityMigration = stakers
    //         .reduce((m, newAddress)=> {
    //                 m[newAddress] = newAddress;
    //                 return m
    //             },
    //         {});
    // }
    return {stakers, identityMigration};

}

async function _checkDelegator(delegator, delegatesMigratedIdentity) {
    const v2Delegation = await callWithRetry(cntr.delegations.methods.getDelegation(delegator));

    let v1DelegationV1Identity = await callWithRetry(cntr.v1Delegations.methods.getCurrentDelegation(delegator));
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
    let scb = await callWithRetry(cntr.staking.methods.getStakeBalanceOf(delegator));
    let dcb = await callWithRetry(cntr.delegations.methods.getDelegatedStakes(delegator));

    if (dcb !== scb) {
        return {
            refreshStake: {addr: delegator}
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
        return batchedArr;
    }, []);

    console.log(`splitting to batches of ${batchSize}`);

    // gas estimate that batches are small enough to pass
    for (const i in batched) {
        const b = batched[i];
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
