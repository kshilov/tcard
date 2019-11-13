const TXWalletType = {
    send: 0,
    lottery_prize: 2,
    deposit : 3,
    withdraw : 4,
    unknown : -1 
}

const TXWalletStatus = {
    new : 0,
    inprogress : 1,
    done : 2,
    failed : -1
}

const QueueStatus = {
    new : 0,
    done : 1,
    synced : 2
}

const QueueType = {
    transactions : 0,
    messages : 1
}

const NotificationType = {
    recieved : 0,
    deposit : 1,
    withdraw : 2,
    advertisment :3,
    prize : 4,
    aff_channel_post: 5
}

const NotificationStatus = {
    new : 0,
    done : 1,
    failed : 2
}

const BOT_NOTIFICATION_ERROR = {
    no_error : 0,
    unknown_error : -1,
    wrong_data : -2
}



const WALLET_ERROR_CODES = {
    no_error : 0,
    unknown_error : -1,
    not_enough_balance : -2,
    no_such_receiver : -3,
    no_such_sender : -4,
    undefined_user : -5
}

const OFFER_TYPE = {
    num : 1,
    sum : 2,
    button : 3,
    unknown : 0
}

const OFFER_CODES = {
    unknown_error : -1,
    exist : -2
}

const OFFER_STATUS = {
    new : 0,
    active : 1,
    paused : 2,
    finished : 3,
    updated : 4
}

const USER_ROLE = {
    banned : -1,
    user : 0,
    channel_owner : 3,
    admin : 10,
}



const SETUP_STEPS = {
    db : 1,
    bot : 2,
    commands : 3,
    middleware : 4,
    notificationmanager : 5,
    RemoteServiceManager : 6,
    balancemanager : 7,
    ChannelMessageManager : 8,
    bot_started : 9
}

const BOT_URL_PREFIX = 'https://t.me/'
const APPLY_BUTTON_PREFIX = 'applyoffer-'


module.exports = {
    TXWalletType,
    TXWalletStatus,
    QueueStatus,
    QueueType,
    NotificationType,
    NotificationStatus,
    SETUP_STEPS,
    WALLET_ERROR_CODES,
    BOT_NOTIFICATION_ERROR,
    OFFER_TYPE,
    OFFER_STATUS,
    APPLY_BUTTON_PREFIX,
    BOT_URL_PREFIX,
    OFFER_CODES,
    USER_ROLE
}