const fs = require("fs");
const path = require("path");

async function main() {
    const srcDir = process.argv[2];
    const contractPath = process.argv[3];
    console.log("🌾srcDir:", srcDir, "🏄‍contractPath:", contractPath);
    if (!srcDir || !contractPath) throw new Error(`expected contracts src dir and truffle compiled contract json full paths`);
    const json = JSON.parse(JSON.stringify(require(path.resolve(contractPath))));
    const metadata = JSON.parse(json.metadata);

    const sources = {};
    for (let contractPath in metadata.sources) {
        if (contractPath.startsWith("@openzeppelin/")) {
            contractPath = path.resolve(process.cwd(), "node_modules", contractPath);
        } else {
            contractPath = contractPath.split(path.sep + path.basename(srcDir) + path.sep)[1];
            contractPath = path.resolve(srcDir, contractPath);
        }

        const content = fs.readFileSync(contractPath, {encoding: "utf8"});
        sources[contractPath] = {content};
    }

    const result = {
        language: metadata.language,
        sources,
        settings: {
            remappings: metadata.settings.remappings,
            optimizer: metadata.settings.optimizer,
            evmVersion: metadata.settings.evmVersion
        }
    }

    const resultPath = path.resolve("./", `${path.basename(contractPath).split(".json")[0]}-input.json`);
    const resultData = JSON.stringify(result, null, 4);
    fs.writeFileSync(resultPath, resultData, {encoding: "utf8"});
    console.log("💰wrote to", resultPath)

    return "done"
}

main().catch(console.error).then(console.log)
