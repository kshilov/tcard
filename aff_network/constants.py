# depricated
ROLE = {
     'ADVERTISER' : 0,
     'AFFILIATE' : 1,
     'MODERATOR' : 2,
     'ADMIN' : 3
}

# depricated
USER_STATUS = {
     'INACTIVE' : 0,
     'ACTIVE' : 1
}

TASK_STATUS = {
    'NEW' : 0,
    'APPROVED' : 1,
    'QUEUED' : 2,
    'PAUSED' : 3,
    'INACTIVE' : 4
}

TASK_TYPE = {
    'AUTOMATIC'  : 0,
    'MANUAL' : 1
}

MESSAGE_STATUS = {
    'NEW' : 0,
    'PUBLISHED' : 1,
    'DEACTIVATED' : 2
}

OFFER_STATUS = {
    'INACTIVE' : 0,
    'ACTIVE' : 1
}

OFFER_TYPE = {
    'CLICK'  : 0,
    'SUBSCRIBE' : 1,
    'PRESUBSCRIBE' : 2
}

TRANSACTION_TYPE = {
    'WITHDRAW'  : 0,
    'DEPOSIT' : 1
}

TRANSACTION_AMOUNT = {
    'ADVERTISER'  : 10,
    'AFFILIATE' : 7,
    'USER' : 1
}

TRANSACTION_CURRENCY = {
    'GRAM'  : 0,
    'USD' : 1,
    'EUR' : 2,
    'RUB' : 3
}

TRANSACTION_STATUS = {
    'NEW'  : 0,
    'HANDLED' : 1,
    'PAID' : 2
}

from datetime import datetime
#postTime = '2019-10-11 18:22:56'
postTime = datetime(2019, 10, 11, 18, 22, 56)

botId = '596029472:AAGMmAiJ6Oj7Kg3-wgn9HfGTbbtQSkXJhz8'

botLink = ''
actionLink = 'http://127.0.0.1:5000/action'
default_redirect_link = 'our_channel_link'
