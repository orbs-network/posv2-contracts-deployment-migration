const readline = require("readline");

async function promptGasPriceGwei(gasPriceSuggestGwei) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return await new Promise(async (resolutionFunc) => {
        let gasPrice = gasPriceSuggestGwei;
        const gasPriceCallback = function (answer) {
            const newPrice = parseInt(answer);

            if (answer === "") { // default selected
                resolutionFunc(gasPrice);
            } else if (isNaN(newPrice) || newPrice <= 0) { // invalid
                rl.question(`Please specify a positive integer.\nOverride gas price? [${gasPrice}] `, gasPriceCallback);
            } else { // overriden
                resolutionFunc(gasPrice);
            }
        };
        rl.question(`Override gas price? [${gasPrice}] `, gasPriceCallback);
    });
}

async function promptFileLoad() {
    const choice = await promptOptions("Found a snapshot file. Load migration snapshot from file?", ["Load", "Override"]);
    if (choice === 'Load') {
        return true;
    }
    if (choice === 'Override') {
        return false;
    }
    throw "Unexpected prompt option";
}

async function promptSkipTx(txIndex, desc) {
    const choice = await promptOptions(`[${txIndex}]\n${desc}\n\n[${txIndex}] Send tx?`, ["Send", "Skip"]);
    if (choice === 'Send') {
        return true;
    }
    if (choice === 'Skip') {
        return false;
    }
    throw "Unexpected prompt option";
}

async function promptOk(questionString) {
    const choice = await promptOptions(questionString, ["Ok", "Cancel"]);
    if (choice === 'Ok') {
        return true;
    }
    if (choice === 'Cancel') {
        return false;
    }
    throw "Unexpected prompt option";
}


async function promptOptions(questionString, options) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return await new Promise(async (resolutionFunc) => {
        const queryString = `${questionString} [${options.join('/')}] `;
        const confirmCallback = function (answer) {
            for (const o of options) {
                if (answer.toLowerCase() === o.toLowerCase() || answer.toLowerCase()[0] === o.toLowerCase()[0]) {
                    resolutionFunc(o);
                    rl.close();
                    return;
                }
            }
            rl.question(queryString, confirmCallback);
        };
        rl.question(queryString, confirmCallback);
    });
}

module.exports = {
    promptGasPriceGwei,
    promptFileLoad,
    promptSkipTx,
    promptOk
};
