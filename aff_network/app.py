from global_web_instances import app
from handlers_init import *


if __name__ == '__main__':
    #app.run(sl_context=(WEBHOOK_SSL_CERT, WEBHOOK_SSL_PRIV),
    #        debug=True)
    app.run(debug=True)