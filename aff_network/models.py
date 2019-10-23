from global_web_instances import db, login_manager, bcrypt
from flask_login import UserMixin
from datetime import datetime
from constants import *
from sqlalchemy import inspect, UniqueConstraint


@login_manager.user_loader
def load_user(user_id):
    #db.drop_all()
    #db.create_all()
    return User.query.get(int(user_id))
   

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String, index=True, unique=True, nullable=False) # unique user id in telegram
    password = db.Column(db.String, nullable=False)

    role = db.Column(db.Integer, nullable=False) # advert. \ affil. \ moder. \ admin
    status = db.Column(db.String, index=True, nullable=False) # active \ inactive

    balance = db.Column(db.Float, index=True, default=0)

    channels = db.relationship('Channel', backref='user', lazy=True)
    offers = db.relationship('Offer', backref='user', lazy=True)

    tasks = db.relationship('Task', backref='user', lazy=True)

    # tak kak nel'zya ssilat'sya na 2 polya odnoy tablitsi
    transactionsAdv = db.relationship('Transaction', backref='userAdv', foreign_keys='Transaction.advId', lazy=True)
    transactionsAff = db.relationship('Transaction', backref='userAff', foreign_keys='Transaction.affId', lazy=True)

    def __repr__(self):
        return '<User {}>'.format(self.username)

    # ATTENTION: you should check old_password=current_password before calling this method
    def change_password(self, new_password):
        self.password = bcrypt.generate_password_hash(new_password).decode('utf-8')

        self.__commit()

    def change_balance_action(self, price):
        if self.role == 'AFFILIATE' and self.status == 'ACTIVE':
            self.balance = self.balance + price * (1 - SERVICE_FEE - USER_FEE)
        elif self.role == 'ADVERTISER' and self.status == 'ACTIVE':
            self.balance = self.balance - price

        self.__commit()

    def replenish_balance(self, balance):
        self.balance = self.balance + balance

        self.__commit()

    def __commit(self):
        exist = User.query.filter_by(id=self.id).first()

        if not exist:
            db.session.add(self)
        
        db.session.commit()


class Channel(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    tgUrl = db.Column(db.String, index=True, unique=True, nullable=False)
    status = db.Column(db.String, index=True, nullable=False) # active \ inactive

    partnerId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    categoryListAff = db.relationship('CategoryListAff', backref='channel', lazy=True)

    def __repr__(self):
        return '<Channel {}>'.format(self.tgUrl)


class Offer(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    tgLink = db.Column(db.String, index=True, unique=True, nullable=False)
    offerType = db.Column(db.String, index=True, nullable=False) # click \ subscribe

    price = db.Column(db.Float, index=True, nullable=False)    
    status = db.Column(db.Integer, index=True, nullable=False) # active \ inactive

    advertId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tasks = db.relationship('Task', backref='offer', lazy=True)

    categoryListAdv = db.relationship('CategoryListAdv', backref='offer', lazy=True)

    def __repr__(self):
        return '<Offer {}>'.format(self.tgLink)

    def change_status(self, status):
        self.status = status
        
        self.__commit()

    def __commit(self):
        exist = Offer.query.filter_by(id=self.id).first()

        if not exist:
            db.session.add(self)
        
        db.session.commit()


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    status = db.Column(db.Integer, index=True, default=0) # new \ approved \ queued \ paused \ inactive
    taskType = db.Column(db.Integer, default=0) # AUTOMATIC \ MANUAL

    previevText = db.Column(db.String, index=True, nullable=False)

    affilId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    offerId = db.Column(db.Integer, db.ForeignKey('offer.id'), nullable=False)
    __table_args__=(UniqueConstraint('affilId', 'offerId', name='unique_offer'),)

    message_queues = db.relationship('MessageQueue', backref='task', lazy=True)
    transactions = db.relationship('Transaction', backref='task', lazy=True)

    def __repr__(self):
        return '<Task {}>'.format(self.id)

    def change_status(self, status):
        self.status = status
        
        self.__commit()

    def __commit(self):
        exist = Task.query.filter_by(id=self.id).first()

        if not exist:
            db.session.add(self)
        
        db.session.commit()


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String, index=True, unique=True, nullable=False)

    categoryListAdv = db.relationship('CategoryListAdv', backref='category', lazy=True)
    categoryListAff = db.relationship('CategoryListAff', backref='category', lazy=True)

    def __repr__(self):
        return '<Category {}>'.format(self.title)


class CategoryListAdv(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    categoryListType = db.Column(db.String, index=True, nullable=False) # ???

    categoryId = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    offerId = db.Column(db.Integer, db.ForeignKey('offer.id'), nullable=False)

    def __repr__(self):
        return '<CategoryListAdv {}>'.format(self.categoryListType)


class CategoryListAff(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    categoryListType = db.Column(db.String, index=True, nullable=False) # ???

    categoryId = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    channelId = db.Column(db.Integer, db.ForeignKey('channel.id'), nullable=False)

    def __repr__(self):
        return '<CategoryListAff {}>'.format(self.categoryListType)


class MessageQueue(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    taskId = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    message_text = db.Column(db.String, nullable=False)
    #message_tgUrl = db.Column(db.String, nullable=False) # advertiser channel

    tgUrl = db.Column(db.String, index=True, nullable=False) # affiliate channel

    status = db.Column(db.Integer) # new / published / deactivated
    posting_time = db.Column(db.DateTime())

    def __repr__(self):
        return '<MessageQueue {}>'.format(self.taskId)

    def create_message(self, task, posting_time):
        self.taskId = task.id
        self.message_text = task.previevText
        self.tgUrl = task.user.channels[0]
        self.status = MESSAGE_STATUS['NEW']
        self.posting_time = posting_time

        self.__commit()

    def change_status(self, status):
        self.status = status
        
        self.__commit()

    def __commit(self):
        exist = MessageQueue.query.filter_by(id=self.id).first()

        if not exist:
            db.session.add(self)
        
        db.session.commit()

    def toDict(self):
        return { c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs }


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    taskId = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)

    advId = db.Column(db.String, db.ForeignKey('user.username'), nullable=False) # tg_id
    affId = db.Column(db.String, db.ForeignKey('user.username'), nullable=True) # tg_id
    userTgId = db.Column(db.String, index=True, nullable=True)
 
    transaction_time = db.Column(db.DateTime(), default=datetime.utcnow)

    adv_amount = db.Column(db.Float, index=True, nullable=False)
    aff_amount = db.Column(db.Float, index=True, nullable=False)
    user_amount = db.Column(db.Float, index=True, nullable=False)

    currency = db.Column(db.Integer, index=True, nullable=False)
    transactionType = db.Column(db.Integer, index=True, nullable=False) # deposit \ withdrow
    actionType = db.Column(db.Integer, index=True, nullable=True) # click \ subscribe = offerType
    transactionStatus = db.Column(db.Integer, index=True, default=TRANSACTION_STATUS['NEW']) # new \ handled \ paid


    def __repr__(self):
        return '<Transaction {}>'.format(self.id)

    @classmethod
    def create_transaction(cls, task, userTgId, transactionType, actionType, status, price):
        transaction = cls()

        transaction.taskId = task.id

        transaction.affId = task.user.username
        transaction.advId = task.offer.user.username

        transaction.userTgId = userTgId

        transaction.adv_amount = -price
        transaction.aff_amount = price * (1 - SERVICE_FEE - USER_FEE)
        transaction.user_amount = price * USER_FEE

        transaction.currency = TRANSACTION_CURRENCY['GRAM']
        transaction.transactionType = transactionType
        transaction.actionType = actionType
        transaction.transactionStatus = status

        transaction.__commit()

        return transaction

    @classmethod
    def create_transaction_deposit(cls, advId, price):
        transaction = cls()

        transaction.advId = advId

        transaction.adv_amount = price
        transaction.aff_amount = 0
        transaction.user_amount = 0

        transaction.currency = TRANSACTION_CURRENCY['GRAM']
        transaction.transactionType = TRANSACTION_TYPE['DEPOSIT']
        transaction.transactionStatus = TRANSACTION_STATUS['HANDLED']

        transaction.__commit()

        return transaction

    def change_status(self, status):
        self.transactionStatus = status
        
        self.__commit()

    def __commit(self):
        exist = Transaction.query.filter_by(id=self.id).first()

        if not exist:
            db.session.add(self)
        
        db.session.commit()

    def toDict(self):
        return { c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs }

