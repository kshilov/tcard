from handlers_init import *

from models import Task, MessageQueue, Transaction
from constants import *
from sqlalchemy import and_, or_
from balance_worker import *
from telethon import TelegramClient
from global_web_instances import app


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

        if not allow_track or offer.status == 'INACTIVE':
            return DEFAULT_REDIRECT_LINK           
        elif offer.offerType == 'SUBSCRIBE':
            actionType = OFFER_TYPE['PRESUBSCRIBE']
            try:
                emit_track_subscribe.apply_async(countdown=5)
            except Exception as e:
                app.logger.info("action emit_track_subscribe.apply_async:%s" % str(e))
        elif offer.offerType == 'CLICK':
                user_aff = User.query.filter_by(id=task.affilId).first()
                user_aff.change_balance_action(price)
                user_adv = User.query.filter_by(id=offer.advertId).first()
                user_adv.change_balance_action(price)
                transactionStatus = TRANSACTION_STATUS['HANDLED']
        else:
            return DEFAULT_REDIRECT_LINK

        link = offer.tgLink

        try:
            emit_create_transaction.apply_async(args=[task.id, user_tg_id, transactionType, actionType, transactionStatus, price])
        except Exception as e:
            app.logger.info("action emit_create_transaction.apply_async:%s" % str(e))
        
        return link

    def update_subscribers_list(self):
        balance_worker = BalanceWorker.getInstance()
        transactions = Transaction.query.filter_by(actionType=OFFER_TYPE['PRESUBSCRIBE']).limit(100).all()
        '''
        for t in transactions:
            try:
                task = t.task
                if self.track_subscriber(t.id, task, t.userTgId):
                    if balance_worker.check_balance(task.offer.advertId):
                        #balance_worker.change_balance(task.affilId, task.offer.price)
                        adv_user = task.offer.user
                        if adv_user:
                            adv_user.change_balance_action(task.offer.price)
                        
                        aff_user =  task.user
                        if aff_user:
                            aff_user.change_balance_action(task.offer.price)

                        t.subscribe()
            except:
                pass

        db.session.commit()
        '''            

    # Need to view in a table Subscribers and check if user exist
    def track_subscriber(self, transaction_id, task, user_tg_id):
        channels = self.get_list_of_channels

        # channel_name = 'TestChannel12358' # test
        channel_name = task.offer.tgLink
        # choose the one that I want list users from
        channel = channels[channel_name]

        # get all users
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

