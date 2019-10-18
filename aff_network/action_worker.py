from models import Task, MessageQueue, Transaction
from constants import *
from sqlalchemy import and_, or_
from balance_worker import *
from telethon import TelegramClient


class ActionWorker():
    __instance = None

    @classmethod 
    def getInstance(cls):
        """ Static access method. """
        if ActionWorker.__instance == None:
            ActionWorker()

        return ActionWorker.__instance
    
    def __init__(self):
        if ActionWorker.__instance != None:
            raise Exception("This class is a singleton!")
        else:
            ActionWorker.__instance = self


    def create_transaction(self, task, user_tg_id):
        balance_worker = BalanceWorker.getInstance()
        offer = task.offer

        # add check here - if user_tg_id is unique for current task
        transactionType = TRANSACTION_TYPE['WITHDRAW']
        actionType = OFFER_TYPE['CLICK']
        transactionStatus = TRANSACTION_STATUS['NEW']
        allow_track = True
        price = offer.price

        if offer.offerType == 'SUBSCRIBE':
            actionType = OFFER_TYPE['PRESUBSCRIBE']
        else:
            # change adv balance
            allow_track = balance_worker.change_balance(offer.advertId, price)
            if allow_track:
                # change aff balance
                balance_worker.change_balance(task.affilId, price)
            transactionStatus = TRANSACTION_STATUS['HANDLED']

        if not allow_track or offer.status == OFFER_STATUS['INACTIVE']:
            return DEFAULT_REDIRECT_LINK

        link = offer.tgLink
        Transaction.create_transaction(task, user_tg_id, transactionType, actionType, transactionStatus, price)

        return link


    # celery
    def update_subscribers_list(self):
        balance_worker = BalanceWorker.getInstance()
        transactions = Transaction.query.filter_by(actionType=OFFER_TYPE['PRESUBSCRIBE']).all()

        for t in transactions:
            task = t.task
            if track_subscriber(t.id, task, t.userTgId):
                if balance_worker.change_balance(task.offer.advertId, task.offer.price):
                    balance_worker.change_balance(task.affilId, task.offer.price)

                    t.update({'actionType': OFFER_TYPE['SUBSCRIBE']}, {'transactionStatus': TRANSACTION_STATUS['HANDLED']})
                    #t.update({'transactionStatus': TRANSACTION_STATUS['HANDLED']})
                


    def track_subscriber(self, transaction_id, task, user_tg_id):
        channels = get_list_of_channels

        # channel_name = 'TestChannel12358' # test
        channel_name = task.offer.tgLink
        # choose the one that I want list users from
        channel = channels[channel_name]

        # get all the users
        for user in client.get_participants(channel):
           # print(user.id, user.first_name, user.last_name, user.username)
           if user.id == user_tg_id:
               return True
        return False


    def get_list_of_channels(self):
        client = TelegramClient(CURRENT_SESSION_NAME, API_ID, API_HASH).start()

        # get all channels that I can access
        channels = {d.entity.username: d.entity
                   for d in client.get_dialogs()
                   if d.is_channel}

        return channels

   
    def deposit_transaction(self, adv_id):
        transactionType = TRANSACTION_TYPE['DEPOSIT']
        actionType = OFFER_TYPE['VOID']
        transactionStatus = TRANSACTION_STATUS['HANDLED']
        user_tg_id = '-'
        # ... deposit before task ... ??
        offer = Offer.query.filter_by(advertId=adv_id).first()
        task = Task.query.filter_by(offerId=offer.id).first()

        Transaction.create_transaction(task, user_tg_id, transactionType, actionType, transactionStatus)

        return DEFAULT_REDIRECT_LINK
