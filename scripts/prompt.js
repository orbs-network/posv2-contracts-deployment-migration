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

module.exports = {
    promptGasPriceGwei,
    promptFileLoad
};
