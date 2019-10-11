from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, SelectField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from models import *
from constants import *


class RegistrationForm(FlaskForm):
    username = StringField('Username',
                           validators=[DataRequired(), Length(min=2, max=32)])
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm Password',
                                     validators=[DataRequired(), EqualTo('password')])
    role = SelectField('Role',
                        choices=[('ADVERTISER','ADVERTISER'), ('AFFILIATE','AFFILIATE'), ('MODERATOR','MODERATOR'), ('ADMIN','ADMIN')])
    submit = SubmitField('Sign Up')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('That username is taken. Please choose a different one.')


class LoginForm(FlaskForm):
    username = StringField('Username',
                           validators=[DataRequired(), Length(min=2, max=32)])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')


class ChangePassForm(FlaskForm):
    passwordOld = PasswordField('Old Password', validators=[DataRequired()])
    passwordNew = PasswordField('New Password', validators=[DataRequired()])
    confirm_passwordNew = PasswordField('Confirm New Password',
                                     validators=[DataRequired(), EqualTo('passwordNew')])
    submit = SubmitField('Change password')


class AddChannelForm(FlaskForm):
    tgUrl = StringField('Telegram url of the channel', validators=[DataRequired()])
    categoryListAff = SelectField('Category of the channel', coerce=int)
    submit = SubmitField('Add channel')

    def validate_channel(self, tgUrl):
        channel = Channel.query.filter_by(tgUrl=tgUrl.data).first()
        if channel:
            raise ValidationError('That channel URL is added. Please choose a different one.')


class CreateOfferForm(FlaskForm):
    tgLink = StringField('Telegram url of the channel', validators=[DataRequired()])
    offerType = SelectField('Offer type',
                        choices=[('CLICK','CLICK'), ('SUBSCRIBE','SUBSCRIBE')])
    categoryListAdv = SelectField('Category of the channel', coerce=int)
    submit = SubmitField('Create offer')


class CreateOfferListForm(FlaskForm):
    previevText = StringField('Telegram message of publication', validators=[DataRequired()])
    taskType = SelectField('Publication type',
                        choices=[('AUTOMATIC','AUTOMATIC'), ('MANUAL','MANUAL')])
    submit = SubmitField('choose offer')


class AddCategoryForm(FlaskForm):
    title = StringField('Title of the category', validators=[DataRequired()])
    submit = SubmitField('Add category')

    def validate_category(self, username):
        category = Category.query.filter_by(title=title.data).first()
        if category:
            raise ValidationError('That category is added. Please choose a different one.')


class TaskCheckForm(FlaskForm):
    submit = SubmitField('Accept task')


