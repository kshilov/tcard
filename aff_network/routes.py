from flask import render_template, url_for, flash, redirect, request
from global_web_instances import app, db, bcrypt
from models import *
from flask_login import login_user, current_user, logout_user, login_required
from forms import *
from global_web_instances import app, db, bcrypt
import flask
from celery_handlers import *
from constants import *
from balance_worker import *
from action_worker import *
from task_worker import *
from sqlalchemy import and_, or_

from functools import wraps

def service_access_level():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_user.role != 'SERVICE':
                return redirect(url_for('access_error_page'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def affiliate_access_level():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_user.role != 'AFFILIATE':
                return redirect(url_for('access_error_page'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def advertiser_access_level():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_user.role != 'ADVERTISER':
                return redirect(url_for('access_error_page'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def moderator_access_level():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_user.role != 'MODERATOR':
                return redirect(url_for('access_error_page'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_access_level():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_user.role != 'ADMIN':
                return redirect(url_for('access_error_page'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route("/")

@app.route("/about")
def about():
    return render_template('about.html', title='About')

@app.route("/access_error_page")
def access_error_page():
    return render_template('access_error_page.html', title='access_error_page')


# /bot/register?username=test2
@app.route("/bot/register", methods=['GET', 'POST'])
def bot_register():
    if current_user.is_authenticated:
        return redirect(url_for('account'))

    form = BotRegistrationForm()

    try:
        username = request.args.get('username')
        user = User.query.filter_by(username=username).first()
        botUser = BotUser.query.filter_by(username=username).first()

        if not user or botUser.status != BOT_USER_STATUS['ACTIVE']:
            return redirect(DEFAULT_REDIRECT_LINK)

        if form.validate_on_submit():
            user.register_user(password=form.password.data)

            flash('Your account has been created! You are now able to log in', 'success')
            return redirect(url_for('login'))

    except Exception as e:
        app.logger.info("bot_register:%s" % str(e))
        return redirect(DEFAULT_REDIRECT_LINK)

    return render_template('bot_register.html', title='Bot_Register', form=form, user=user)


@app.route("/register", methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('account'))
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        # how does it work with jinja2?
        #user = User(username=form.username.data, password=hashed_password, role=ROLE[form.role.data], status=USER_STATUS['ACTIVE'])
        user = User(username=form.username.data, password=hashed_password, role=form.role.data, status='ACTIVE')
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created! You are now able to log in', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)


@app.route("/login", methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('account'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('account'))
        else:
            flash('Login Unsuccessful. Please check username and password', 'danger')
    return render_template('login.html', title='Login', form=form)


@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route("/new/bot_users_list", methods=['GET', 'POST'])
@login_required
@moderator_access_level()
def new_bot_users_list():
    botUsers = BotUser.query.filter_by(status=BOT_USER_STATUS['NEW']).all()

    form = AddUserForm()
    bot_user_id = 'none_id'
    if form.validate_on_submit():
        bot_user_id = request.form.get('submit')
        botUser = BotUser.query.filter_by(id=bot_user_id).first()
        User.add_user(botUser.username, form.role.data)

        botUser.change_status(BOT_USER_STATUS['ACTIVE'])

        flash('User added', 'success')
        return redirect(url_for('new_bot_users_list'))

    return render_template('new_bot_users_list.html', title='new_bot_users_list', form=form, botUsers=botUsers)   


@app.route("/active/bot_users_list", methods=['GET', 'POST'])
@login_required
@moderator_access_level()
def active_bot_users_list():
    botUsers = BotUser.query.filter_by(status=BOT_USER_STATUS['ACTIVE']).all()

    return render_template('active_bot_users_list.html', title='active_bot_users_list', botUsers=botUsers)   


@app.route("/users_list", methods=['GET', 'POST'])
@login_required
@moderator_access_level()
def users_list():
    users = User.query.all()

    return render_template('users_list.html', title='Users_list', users=users)   


@app.route("/account", methods=['GET', 'POST'])
@login_required
def account():
    form = ChangePassForm()
    if form.validate_on_submit():
        user = current_user
        if user and bcrypt.check_password_hash(user.password, form.passwordOld.data):
        
            user.change_password(form.passwordNew.data)

            flash('Password changed', 'success')
            return redirect(url_for('login'))
        else:
            flash('Change Unsuccessful. Please check your old password', 'danger')
    return render_template('account.html', title='Account', form=form)


@app.route("/channel", methods=['GET', 'POST'])
@affiliate_access_level()
@login_required
def channel():
# to create a List of existing categories to choose one by Affiliate
    formCategories = [(g.id, g.title) for g in Category.query.all()]
    form = AddChannelForm()
    form.categoryListAff.choices = formCategories

    if form.validate_on_submit():
        channel = Channel(tgUrl=form.tgUrl.data, status='ACTIVE', partnerId=current_user.id)
        if channel:
            db.session.add(channel)
            db.session.commit()
        else:
            flash('Please check Telegram URL', 'danger')
        categoryListAff = CategoryListAff(categoryId=form.categoryListAff.data, channelId=channel.id)
        if categoryListAff:
            db.session.add(categoryListAff)
            db.session.commit()
            flash('Channel added', 'success')
            return redirect(url_for('channel'))
        else:
            flash('Please check Telegram URL', 'danger')
    
    return render_template('channel.html', title='Channel', form=form)


@app.route("/offer", methods=['GET', 'POST'])
@advertiser_access_level()
@login_required
def offer():
    # to create a List of existing categories to choose one by Advertiser
    formCategories = [(g.id, g.title) for g in Category.query.all()]
    form = CreateOfferForm()
    form.categoryListAdv.choices = formCategories

    if form.validate_on_submit():
        offer = Offer(tgLink=form.tgLink.data, offerType=form.offerType.data, price=form.price.data, status='ACTIVE', advertId=current_user.id)
        if offer:
            db.session.add(offer)
            db.session.commit()
        else:
            flash('Please check Telegram URL', 'danger')
        categoryListAdv = CategoryListAdv(categoryId=form.categoryListAdv.data, offerId=offer.id)
        if categoryListAdv:
            db.session.add(categoryListAdv)
            db.session.commit()
            flash('Offer created', 'success')
            return redirect(url_for('offer'))
        else:
            flash('Please check Telegram URL', 'danger')
    return render_template('offer.html', title='Offer', form=form)


@app.route("/offerList", methods=['GET', 'POST'])
@affiliate_access_level()
@login_required
def offerList():
    offers = list()
    if current_user.channels:
        offersAll = Offer.query.filter_by(status='ACTIVE').all()
        for offer in offersAll:
            offers.append(offer)

        ### I've just commented your code - it's not working, just debug this.
        # THIS: categories = CategoryListAdv.query.join(CategoryListAff, CategoryListAff.categoryId == CategoryListAdv.categoryId).filter(CategoryListAdv.id == current_user.channels[0].categoryListAff[0].id).all()
        ##offers = Offer.query.filter( and_(Offer.categoryListAdv[0].categoryId == categories[0].categoryId, Offer.status == 'ACTIVE') ).all()
        #if not current_user.tasks:
        # THIS: offersAll = Offer.query.filter_by(status='ACTIVE').all()
        #else:
        #    accepted_offers = Offer.query.filter(Offer.tasks.contains(current_user.tasks)).all()
        #    offersAll = Offer.query.join(accepted_offers, accepted_offers.id != Offer.id).filter_by(status='ACTIVE').all()
        # THIS: for offer in offersAll:
        # THIS:    if offer.categoryListAdv[0].categoryId == categories[0].categoryId:
        # THIS:        offers.append(offer)

    form = CreateOfferListForm()
    if form.validate_on_submit():
        offer_id = request.form.get('submit')
        try:
            task = Task(taskType=form.taskType.data, previevText=form.previevText.data, affilId=current_user.id, offerId=offer_id)

            db.session.add(task)
            db.session.commit()
            flash('Offer accepted', 'success')
            return redirect(url_for('offerList'))
        except Exception:
            db.session.rollback()
            flash('Offer error', 'danger')

    return render_template('offerList.html', title='OfferList', form=form, offers=offers)


@app.route("/category", methods=['GET', 'POST'])
@login_required
@moderator_access_level()
def category():
    form = AddCategoryForm()
    allCategories = Category.query.all()
    if form.validate_on_submit():
        category = Category(title=form.title.data)
        #if category:
        db.session.add(category)
        db.session.commit()
        flash('Category added', 'success')
        return redirect(url_for('category'))
        #else: flash('Category already exist', 'danger')
    return render_template('category.html', title='Category', form=form, allCategories=allCategories)


@app.route("/taskCheck", methods=['GET', 'POST'])
@login_required
@moderator_access_level()
def taskCheck():
    tasks = Task.query.filter_by(status=TASK_STATUS['NEW']).all()
    form = TaskCheckForm()

    task_id = 'none_task'
    if form.validate_on_submit():
        task_id = request.form.get('submit')
        task = Task.query.filter_by(id=task_id).first()
        task.change_status(TASK_STATUS['APPROVED'])

        try:
            emit_message_queue_create.apply_async()
            #emit_post_messages.apply_async()
        except Exception as e:
            app.logger.info("emit_message_queue_create.apply_async:%s" % str(e))

        flash('Task accepted', 'success')
        return redirect(url_for('taskCheck'))

    return render_template('taskCheck.html', title='TaskCheck', form=form, tasks=tasks)


@app.route("/channel/check", methods=['GET', 'POST'])
@login_required
@moderator_access_level()
def channelCheck():
    channels = Channel.query.all()
    form = EditChannelForm()
    #form.tgUrl.data = channels[0].tgUrl

    channel_id = 'none_channel'
    if form.validate_on_submit():
        channel_id = request.form.get('submit')
        channel = Channel.query.filter_by(id=channel_id).first()
        #form.tgUrl.data = channel.tgUrl
        channel.change_url(form.tgUrl.data)

        flash('Channel changed', 'success')
        return redirect(url_for('channelCheck'))

    return render_template('channelCheck.html', title='ChannelCheck', form=form, channels=channels)


@app.route("/currentUserTasks", methods=['GET', 'POST'])
#@app.route("/user/tasks", methods=['GET', 'POST'])
@login_required
@affiliate_access_level()
def currentUserTasks():
    tasks = Task.query.filter_by(affilId=current_user.id).all()
    return render_template('currentUserTasks.html', title='CurrentUserTasks', tasks=tasks)

   
@app.route("/allTasks", methods=['GET', 'POST'])
#@app.route("/tasks", methods=['GET', 'POST'])
@login_required
@moderator_access_level()
def allTasks():
    tasks = Task.query.all()

    return render_template('allTasks.html', title='TaskCheck', tasks=tasks)     


@app.route("/messages", methods=['GET', 'POST'])
@login_required
@moderator_access_level()
def messages():
    messages = MessageQueue.query.all()

    return render_template('messages.html', title='Messages', messages=messages)   


# /action?task_id=1&user_id=1
# /action?task_id=3&user_id=@GreenMrGreen
@app.route("/action", methods=['GET', 'POST'])
def action():
    try:
        task_id = request.args.get('task_id')
        user_tg_id = request.args.get('user_id')
        #app.logger.info('--------------------------------')
        #app.logger.info(user_tg_id)
        #app.logger.info(task_id)

        task = Task.query.filter_by(id=task_id).first()
        if not task:
            return redirect(DEFAULT_REDIRECT_LINK)

        actionWorker = ActionWorker.getInstance()
        link = actionWorker.create_transaction(task, user_tg_id)

        return redirect(link)
    except Exception as e:
        app.logger.info("action:%s" % str(e))
        return redirect(DEFAULT_REDIRECT_LINK)
 


@app.route("/transactions", methods=['GET', 'POST'])
@login_required
def transactions():
    balance = current_user.balance

    if current_user.status == 'ADVERTISER':
        transactions = Transaction.query.filter_by(advId=g.id).limit(30).all()
    elif current_user.status == 'AFFILIATE':
        transactions = Transaction.query.filter_by(affId=g.id).limit(30).all()
    else:
        transactions = Transaction.query.limit(30).all()

    return render_template('transactions.html', title='Transactions', balance=balance, transactions=transactions)


########
#
# Methods to work with node.js service
# VERY CAREFULL change this - as it will affect the work of the core
#
########

@app.route("/balance/get/transactions", methods=['GET'])
# @login_required
# @service_access_level
def get_transactions():
    try:
        transactions = Transaction.query.filter(and_(
            Transaction.transactionType == TRANSACTION_TYPE['WITHDRAW'],
            Transaction.transactionStatus == TRANSACTION_STATUS['HANDLED']
            )).limit(50).all()

        txArr = []
        for tx in transactions:
            txArr.append(tx.toDict()) 

        return flask.jsonify(txArr)
    except Exception as e:
        app.logger.info("get_transactions:%s" % str(e))
        return flask.jsonify([])
        

@app.route("/balance/update/transactions/paid", methods=['POST'])
# need to pass list of IDs of tx to update: [1,2,3,..]
# @login_required
# @service_access_level
def update_tx_paid():
    rq = request.json
    transactions_id = rq['data']

    if (len(transactions_id) <= 0):
        return ''

    Transaction.query.filter(Transaction.id.in_(transactions_id)).update({'transactionStatus': TRANSACTION_STATUS['PAID']}, synchronize_session='fetch')
    db.session.commit()
    return ''

@app.route("/balance/update/transactions/handled", methods=['POST'])
# need to pass list of IDs of tx to update: [1,2,3,..]
# @login_required
# @service_access_level
def update_tx_handled():
    rq = request.json
    transactions_id = rq['data']
    if (len(transactions_id) <= 0):
        return ''

    Transaction.query.filter(Transaction.id.in_(transactions_id)).update({'transactionStatus': TRANSACTION_STATUS['HANDLED']}, synchronize_session='fetch')
    db.session.commit()
    return ''

@app.route("/messages/get", methods=['GET'])
# @login_required
# @service_access_level
def get_messages():
    try:
        messages = MessageQueue.query.filter(and_(
            MessageQueue.status == MESSAGE_STATUS['NEW']
            )).limit(50).all()

        msgArr = []
        for msg in messages:
            msgArr.append(msg.toDict()) 

        return flask.jsonify(msgArr)
    except Exception as e:
        app.logger.info("get_messages:%s" % str(e))
        return flask.jsonify([])


@app.route("/messages/update/published", methods=['POST'])
# need to pass list of IDs of tx to update: [1,2,3,..]
# @login_required
# @service_access_level
def update_messages_published():
    rq = request.json
    messages_id = rq['data']
    if (len(messages_id) <= 0):
        return ''

    MessageQueue.query.filter(MessageQueue.id.in_(messages_id)).update({'status': MESSAGE_STATUS['PUBLISHED']}, synchronize_session='fetch')
    db.session.commit()
    return ''


#r = requests.post('http://127.0.0.1:5000/balance/create/transactions/deposit', json = {"test1": 500})
@app.route("/balance/create/transactions/deposit", methods=['POST'])
# @login_required
# @service_access_level
def create_tx_deposit():
    rq = request.json
    users = rq['data']
    if (len(users) <= 0):
        return ''

    # users = [{username:'user1', amount:12}, {username:'user2', amount:23}]
    # users = {'teast1': 500}
    for u_dict in users:
        Transaction.create_transaction_deposit(u_dict)
    
    try:
        emit_handle_paid_transaction.apply_async()
    except Exception as e:
        app.logger.info("emit_handle_paid_transaction.apply_async:%s" % str(e))

    return ''


#r = requests.post('http://127.0.0.1:5000/create/botUser', json = [{'username':'test1', 'tgId':123456789}])
@app.route("/create/botUser", methods=['POST'])
# @login_required
# @service_access_level
def create_botUser():
    users = request.json
    if (len(users) <= 0):
        return ''

    # users = [{username:'user1', tgId:12}, {username:'user2', tgId:23}]
    # users = {'teast1': 123}
    for u_dict in users:
        BotUser.create_bot_user(u_dict)
    
    return ''


@app.route("/get/roles", methods=['GET', 'POST'])
# @login_required
# @service_access_level
def get_roles():
    try:
        users = request.json
        if (len(users) <= 0):
            return flask.jsonify([])

        all_users = User.query.filter(User.username.in_(users)).all()
   
        usersArr = []
        for u in all_users:
            usersArr.append(u.toDict()) 

        return flask.jsonify(usersArr)
    except Exception as e:
        app.logger.info("get_roles:%s" % str(e))
        return flask.jsonify([])
    
