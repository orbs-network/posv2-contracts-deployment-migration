import {migrateGuardians} from "./migrate-guardians-lib";
import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";

migrateGuardians(new Web3Driver(), "0xAB7F3d56Da621Cff1F5646642d7F79f6A201E4eD").then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);