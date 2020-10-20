const {constructSnapshot} = require("./migrations-lib")(web3);
const path = require("path");
const fs = require("fs");

module.exports = async function(callback) {
    try {
        const snapshot = await constructSnapshot();
        const outputPath = path.join(__dirname, '..', 'migrationSnapshot.json');
        console.log("Writing snapshot file to:", outputPath);
        fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
        callback();
    } catch (e) {
        callback(e)
    }
};