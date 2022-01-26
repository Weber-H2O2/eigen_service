import { Sequelize, DataTypes, Op } from "sequelize";
import * as walletdb from "./database_wallet";

const sequelizeMeta = new Sequelize({
  dialect: "sqlite",

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  storage: "./data/db_multisig_meta.sqlite",
});

const multisigMetaDB = sequelizeMeta.define("multisig_meta_st", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: DataTypes.INTEGER,
    wallet_address: DataTypes.CITEXT,
    to: DataTypes.CITEXT,
    value: DataTypes.STRING,
    data: DataTypes.STRING,
    txid: DataTypes.CITEXT
})

const sequelizeSignHistory = new Sequelize({
    dialect: "sqlite",

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    storage: "./data/db_sign_history.sqlite",
});

const signHistoryDB = sequelizeSignHistory.define("sign_history", {
    mtxid: DataTypes.INTEGER,
    signer_address: DataTypes.CITEXT,
    sign_message: DataTypes.STRING,
    status: DataTypes.INTEGER
})

sequelizeMeta
.sync()
.then(function () {
    return multisigMetaDB.create({
        user_id: 1,
        wallet_address: "0x",
        to: "0x", // Owner or signer's address
        value: "",
        data: "",
        txid: "",
    });
})
.then(function (row: any) {
    console.log(
        row.get({
            user_id: 1,
            wallet_address: "0x",
        })
    );
    multisigMetaDB.destroy({
        where: {
            user_id: row.user_id,
            wallet_address: row.wallet_address,
        },
    });
})
.catch(function (err) {
    console.log("Unable to connect to the database:", err);
});

sequelizeSignHistory
.sync()
.then(function () {
    return multisigMetaDB.create({
        mtxid: 0,
        signer_address: "0x",
        sign_message: "0x", // Owner or signer's address
        status: walletdb.SignerStatus.None,
    });
})
.then(function (row: any) {
    console.log(
        row.get({
            id: row.id,
        })
    );
    multisigMetaDB.destroy({
        where: {
            id: row.id,
        },
    });
})
.catch(function (err) {
    console.log("Unable to connect to the database:", err);
});

const addMultisigMeta = function (
    user_id,
    wallet_address,
    to,
    value,
    data
) {
    let txid = ""
    return multisigMetaDB.create({
        user_id,
        wallet_address,
        to,
        value,
        data,
        txid
    });
};

const findMultisigMetaByConds = function (conds) {
    return multisigMetaDB.findOne({ where: conds, raw: true});
};

const updateMultisigMeta = function (
    id,
    txid
) {
    return multisigMetaDB
    .findOne({
        where: {
            id: id
        },
    })
    .then(function (row: any) {
        if (row === null) {
            return false;
        }
        let actual_update_dict = {txid: txid};

        return row
        .update(actual_update_dict)
        .then(function (result) {
            console.log("Update success: " + JSON.stringify(result));
            return true;
        })
        .catch(function (err) {
            console.log("Update error: " + err);
            return false;
        });
    });
};


const addSignMessage = function (
    mtxid,
    signer_address,
    sign_message,
    status
) {
    return signHistoryDB.create({
        mtxid,
        signer_address,
        sign_message,
        status
    });
};

const findSignHistoryByMtxidAndStatus = function (mtxid, status) {
    return signHistoryDB.findAll({ where: {mtxid, status} });
};

export {
    addSignMessage,
    findSignHistoryByMtxidAndStatus,
    findMultisigMetaByConds,
    addMultisigMeta,
    updateMultisigMeta,
};
