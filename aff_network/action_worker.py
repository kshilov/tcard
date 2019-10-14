from models import Action, Task, MessageQueue, Transaction
from constants import *
from sqlalchemy import and_, or_


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

        link = task.offer.tgLink

        transactionType = TRANSACTION_TYPE['WITHDRAW']
        actionType = OFFER_TYPE['CLICK']
        transactionStatus = TRANSACTION_STATUS['NEW']
        allow_track = True

        if offer.offerType == 'SUBSCRIBE':
            actionType = OFFER_TYPE['PRESUBSCRIBE']
        else:
            allow_track = balance_worker.track_balance(offer.advertId, offer.price)
            transactionStatus = TRANSACTION_STATUS['HANDLED']

        if not allow_track or offer.status == OFFER_STATUS['INACTIVE']:
            return DEFAULT_REDIRECT_LINK

        Transaction.create_transaction(task, user_tg_id, transactionType, actionType, transactionStatus)

        return link
   
     
    # celery
    def track_subscribe(self, task, user_tg_id)
        pass
        subscribers_id_list = bot.getSubscribers(task.offer.tgLink)
        result_table = innerJoin (transactions, subscribers_id_list)
        for user in result_table:
            transaction = Transaction.query.filter_by(userTgId=user.id)
            transaction.change_status(TRANSACTION_STATUS['HANDLED'])





