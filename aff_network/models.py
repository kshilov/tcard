from global_web_instances import db, login_manager
from flask_login import UserMixin


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
   

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String, index=True, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)

    role = db.Column(db.Integer, nullable=False) # advert. \ affil. \ moder. \ admin
    status = db.Column(db.String, index=True, nullable=False) # active \ inactive

    channels = db.relationship('Channel', backref='user', lazy=True)
    offers = db.relationship('Offer', backref='user', lazy=True)

    tasks = db.relationship('Task', backref='user', lazy=True)
    transactions = db.relationship('Transaction', backref='user', lazy=True)

    def __repr__(self):
        return '<User {}>'.format(self.username)

    #ATTENTION: you should check old_password=current_password before calling this method
    def change_password(self, new_password):
        self.password = bcrypt.generate_password_hash(new_password).decode('utf-8')

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
    taskType = db.Column(db.String, default=0)

    previevText = db.Column(db.String, index=True, nullable=False)

    affilId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    offerId = db.Column(db.Integer, db.ForeignKey('offer.id'), nullable=False)

    message_queues = db.relationship('MessageQueue', backref='task', lazy=True)

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

    status = db.Column(db.Integer) # new / published / deactivated
    posting_time = db.Column(db.DateTime())

    def __repr__(self):
        return '<MessageQueue {}>'.format(self.taskId)

    def create_message(self, task, posting_time):
        self.taskId = task.id
        self.status = 0
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


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    taskId = db.Column(db.Integer, db.ForeignKey('task.id')

    affilId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    advId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    transaction_time = db.Column(db.DateTime(), nullable=False)
    userTgId = db.Column(db.String, index=True, nullable=False)

    adv_amount = db.Column(db.Float, index=True, nullable=False)
    aff_amount = db.Column(db.Float, index=True, nullable=False)
    user_amount = db.Column(db.Float, index=True, nullable=False)

    currency = db.Column(db.Integer, index=True, nullable=False)
    transactionType = db.Column(db.Integer, index=True, nullable=False) # deposit \ withdrow
    actionType = db.Column(db.Integer, index=True, nullable=False) # click \ subscribe = offerType


    def __repr__(self):
        return '<Transaction {}>'.format(self.taskId)

    def create_transaction(self, task, transaction_time, userTgId, transactionType, actionType):
        self.taskId = task.id

        self.affilId = task.affilId
        self.advId = task.offer.advertId

        self.transaction_time = transaction_time
        self.userTgId = userTgId

        self.adv_amount = TRANSACTION_TYPE['ADVERTISER']
        self.aff_amount = TRANSACTION_TYPE['AFFILIATE']
        self.user_amount = TRANSACTION_TYPE['USER']
       
        self.transactionType = transactionType
        self.actionType = actionType

        self.__commit()

    def change_status(self, status):
        self.status = status
        
        self.__commit()

    def __commit(self):
        exist = Transaction.query.filter_by(id=self.id).first()

        if not exist:
            db.session.add(self)
        
        db.session.commit()
