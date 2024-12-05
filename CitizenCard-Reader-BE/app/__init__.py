import os

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://pthttm:pthttm@localhost:3308/pthttm'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['IMAGE_FOLDER'] = os.path.join(app.config['UPLOAD_FOLDER'], 'images')
    app.config['LABEL_FOLDER'] = os.path.join(app.config['UPLOAD_FOLDER'], 'labels')

    db.init_app(app)

    from .controller import sample_controller
    app.register_blueprint(sample_controller.sample_bp)

    from .model import sample_model
    with app.app_context():
        db.create_all()

    return app
