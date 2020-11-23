import {migrateGuardians} from "./migrate-guardians-lib";
import {Web3Driver} from "@orbs-network/orbs-ethereum-contracts-v2";

const PREVIOUS_GUARDIAN_REGISTRATION_CONTRACT_ADDR = "0xce97f8c79228c53b8b9ad86800a493d1e7e5d1e3";
const NEW_GUARDIAN_REGISTRATION_CONTRACT_ADDR = "0xce97f8c79228c53b8b9ad86800a493d1e7e5d1e3";

migrateGuardians(new Web3Driver(), PREVIOUS_GUARDIAN_REGISTRATION_CONTRACT_ADDR, NEW_GUARDIAN_REGISTRATION_CONTRACT_ADDR).then(
    () => {
        console.log('Done');
        process.exit(0);
    }
,   (e) => {
        console.error(e);
        process.exit(1);
    }
);