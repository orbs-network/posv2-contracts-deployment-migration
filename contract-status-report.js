const {getAbiByContractName, getAbiByContractRegistryKey} = require("@orbs-network/orbs-ethereum-contracts-v2");

const Web3 = require("web3");

const CONTRACT_REGISTRY_ADDR = "0xD859701C81119aB12A1e62AF6270aD2AE05c7AB3";

async function getFunction() {
    const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/62f4815d28674debbe4703c5eb9d413c"));
    const status = {};

    const block = await web3.eth.getBlockNumber();
    
    const contractRegistry = new web3.eth.Contract(getAbiByContractName('ContractRegistry'), CONTRACT_REGISTRY_ADDR);

    const getContract = async (registryKey) => (new web3.eth.Contract(getAbiByContractRegistryKey(registryKey), await contractRegistry.methods.getContract(registryKey).call()));

    const delegationsContract = await getContract('delegations');

    await Promise.all([
        (async () => {
            status.totalDelegatedStake = await delegationsContract.methods.getTotalDelegatedStake().call({}, block);
        })(),
        (async () => {
            const delegator = "0x553C3781677a2185d4ea9C8EEFBE971F03ad1417";
            status.delegations = await delegationsContract.methods.getDelegation(delegator).call({}, block);
        })(),
    ])

    console.log(JSON.stringify(status, null, 2));
}

getFunction().then(
    () => console.log("Done"),
    e => console.error(e)
)

