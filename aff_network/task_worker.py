from models import MessageQueue
from models import Task
from constants import *
from sqlalchemy import and_, or_

import telebot 
from telebot import types

bot = telebot.TeleBot(botId)

class TaskWorker():
    __instance = None

    @staticmethod 
    def getInstance():
        """ Static access method. """
        if TaskWorker.__instance == None:
            TaskWorker()

        return TaskWorker.__instance
    
    def __init__(self):
        if TaskWorker.__instance != None:
            raise Exception("This class is a singleton!")
        else:
            TaskWorker.__instance = self

    def message_queue_create(self):
        tasks = Task.query.filter( and_(
                Task.status == TASK_STATUS['APPROVED'],
                Task.taskType == TASK_TYPE['AUTOMATIC']
        )
        ).limit(30).all()

        for task in tasks:
            message_queue = MessageQueue()

            message_queue.create_message(task, postTime)

            task.change_status(TASK_STATUS['QUEUED'])


    #def task_execute(self):
        #pass


    def post_messages(self):
        message_queues = MessageQueue.query.filter(
                MessageQueue.status == MESSAGE_STATUS['NEW']
        ).limit(30).all()

        for message_queue in message_queues:
            task = message_queue.task
            offer = task.offer
            link = offer.tgLink

            message = task.previevText + link

            chatId = -1001321811797
            #chatId = task.affilId
            bot.send_message(chatId, message, 1)

            message_queue.change_status(MESSAGE_STATUS['PUBLISHED'])


    def deactivate_offer(self, offer_id):     
        Task.query.filter_by(offerId=offer_id).update({'status': TASK_STATUS['PAUSED']})






