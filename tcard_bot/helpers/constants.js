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


module.exports = {
    ActionType,
    ActionStatus
}