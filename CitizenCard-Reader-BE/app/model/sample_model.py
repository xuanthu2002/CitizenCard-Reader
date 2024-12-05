from app import db


class Sample(db.Model):
    __tablename__ = 'tbl_samples'

    sample_id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String(255))
    label_path = db.Column(db.String(255))
    create_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

    def __repr__(self):
        return f"<Sample {self.sample_id} - {self.image_path}>"

    @classmethod
    def get_sample(cls, sample_id):
        return cls.query.get(sample_id)

    @classmethod
    def add_sample(cls, image_path, label_path):
        new_sample = cls(image_path=image_path, label_path=label_path)
        db.session.add(new_sample)
        db.session.commit()
        return new_sample

    @classmethod
    def get_samples(cls, page, size):
        total_samples = cls.query.count()
        offset = page * size
        samples = cls.query.offset(offset).limit(size).all()
        return samples, total_samples

    @classmethod
    def delete_sample(cls, sample_id):
        sample = cls.query.get(sample_id)
        if sample:
            db.session.delete(sample)
            db.session.commit()
            return True
        return False
