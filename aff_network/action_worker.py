from models import MessageQueue
from models import Action
from constants import *
from sqlalchemy import and_, or_

from datetime import datetime

import telebot 
from telebot import types

bot = telebot.TeleBot(botId)

class ActionWorker():
    __instance = None

    @staticmethod 
    def getInstance():
        """ Static access method. """
        if ActionWorker.__instance == None:
            ActionWorker()

        return ActionWorker.__instance
    
    def __init__(self):
        if ActionWorker.__instance != None:
            raise Exception("This class is a singleton!")
        else:
            ActionWorker.__instance = self

    def action_create(self, task_id, user_id, transactionType, actionType):
        task = Task.query.filter_by(id=task_id).first()

        transaction_time = datetime.now()
        transaction = Transaction()
        transaction.create_transaction(task, transaction_time, user_id, transactionType, actionType)






