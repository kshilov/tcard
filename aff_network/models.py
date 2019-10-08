from global_web_instances import db, login_manager
from flask_login import UserMixin


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

   

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, index=True, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False) # advert. \ affil. \ moder. \ admin
    status = db.Column(db.String, index=True, nullable=False) # active \ inactive
    channels = db.relationship('Channel', backref='user', lazy=True)
    offers = db.relationship('Offer', backref='user', lazy=True)
    tasks = db.relationship('Task', backref='user', lazy=True)

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
    taskId = db.Column(db.Integer, db.ForeignKey('task.id'))
#    status = db.Column(db.String(10), index=True, nullable=False) # new / published / deactivated

    status = db.Column(db.Integer)
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
