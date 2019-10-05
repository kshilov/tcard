from handlers_init import *
from global_web_instances import *
from models import *

db.create_all()
db.session.commit()
