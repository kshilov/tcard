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
        price = offer.price

        # check adv balance
        allow_track = balance_worker.check_balance(offer.advertId)

        if offer.offerType == 'SUBSCRIBE':
            actionType = OFFER_TYPE['PRESUBSCRIBE']
            if not allow_track:
                return DEFAULT_REDIRECT_LINK
        elif allow_track and offer.status == 'ACTIVE':
                # change adv and aff balance
                user_aff = User.query.filter_by(id=task.affilId).first()
                user_aff.change_balance_action(price)
                user_adv = User.query.filter_by(id=offer.advertId).first()
                user_adv.change_balance_action(price)
                transactionStatus = TRANSACTION_STATUS['HANDLED']
        else:
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
            if self.track_subscriber(t.id, task, t.userTgId):
                if balance_worker.change_balance(task.offer.advertId, task.offer.price):
                    balance_worker.change_balance(task.affilId, task.offer.price)

                    t.update({'actionType': OFFER_TYPE['SUBSCRIBE']}, {'transactionStatus': TRANSACTION_STATUS['HANDLED']})
                    #t.update({'transactionStatus': TRANSACTION_STATUS['HANDLED']})
                    db.session.commit()
                


    def track_subscriber(self, transaction_id, task, user_tg_id):
        channels = self.get_list_of_channels

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

   
    def deposit_transaction(self):
        transactions = Transaction.query.filter( and_(transactionType=TRANSACTION_TYPE['DEPOSIT'], transactionStatus=TRANSACTION_STATUS['HANDLED']) ).all()
        for t in transactions:
            User.query.filter_by(id=t.advId).update({'balance': balance + t.adv_amount})
            t.update({'transactionStatus': TRANSACTION_STATUS['PAID']})
        db.session.commit()


