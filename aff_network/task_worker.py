from models import TaskQueue
from models import Task
from constants import *

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

    def task_create(self):
        tasks = Task.query.filter(
                Task.status == TASK_STATUS['APPROVED']
        ).limit(30).all()

        for task in tasks:
            task_queue = TaskQueue()
            task_queue.add(task)
            task.change_status(TASK_STATUS['HANDLED'])

    def task_execute(self):
        pass