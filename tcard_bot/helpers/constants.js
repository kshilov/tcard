const ActionType = {
    wallet_send: 0,
    wallet_recieved: 1,
    wallet_creation: 2,
    lottery_win: 3    
}

const ActionStatus = {
    new : 0,
    handled : 1
}

const SyncStatus = {
    new : 0,
    handled : 1,
}

const SyncType = {
    transactions : 0,
    messages : 1
}

const SyncDataStatus = {
    new : 0,
    done : 1,
    synced : 2
}



module.exports = {
    ActionType,
    ActionStatus,
    SyncStatus,
    SyncType,
    SyncDataStatus
}