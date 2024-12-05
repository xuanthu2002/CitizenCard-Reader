import os
import uuid

from flask import Blueprint, request, jsonify, send_from_directory, abort

from app.model.sample_model import Sample
from settings import UPLOAD_FOLDER

sample_bp = Blueprint('sample', __name__)

IMAGE_FOLDER = os.path.join(UPLOAD_FOLDER, 'images')
LABEL_FOLDER = os.path.join(UPLOAD_FOLDER, 'labels')


@sample_bp.route('/uploads/images/<filename>')
def upload_image(filename):
    try:
        return send_from_directory(IMAGE_FOLDER, filename)
    except FileNotFoundError:
        abort(404, description="Image not found")


@sample_bp.route('/uploads/labels/<filename>')
def upload_label(filename):
    try:
        return send_from_directory(LABEL_FOLDER, filename)
    except FileNotFoundError:
        abort(404, description="Label not found")


@sample_bp.route('/samples', methods=['POST'])
def add_sample():
    if 'image' not in request.files or 'label' not in request.files:
        return jsonify({"error": "No image or label file uploaded"}), 400

    image_file = request.files['image']
    label_file = request.files['label']

    if image_file.filename == '' or label_file.filename == '':
        return jsonify({"error": "No selected image or label file"}), 400

    sample_file_name = uuid.uuid4()

    image_extension = os.path.splitext(image_file.filename)[1]
    image_filename = f"{sample_file_name}{image_extension}"
    image_path = os.path.join(IMAGE_FOLDER, image_filename)
    image_file.save(image_path)

    label_extension = os.path.splitext(label_file.filename)[1]
    label_filename = f"{sample_file_name}{label_extension}"
    label_path = os.path.join(LABEL_FOLDER, label_filename)
    label_file.save(label_path)

    new_sample = Sample.add_sample(image_path=image_path, label_path=label_path)

    return jsonify({"message": "Sample added successfully", "sample_id": new_sample.sample_id}), 201


@sample_bp.route('/samples', methods=['GET'])
def get_samples():
    page = request.args.get('page', default=0, type=int)
    size = request.args.get('size', default=10, type=int)

    samples, total_samples = Sample.get_samples(page, size)

    result = [{
        "sample_id": sample.sample_id,
        "image_path": sample.image_path,
        "label_path": sample.label_path,
        "create_at": sample.create_at
    } for sample in samples]

    total_pages = (total_samples // size) + (1 if total_samples % size else 0)

    return jsonify({
        "page": page,
        "size": size,
        "total_samples": total_samples,
        "total_pages": total_pages,
        "samples": result
    }), 200


@sample_bp.route('/samples/<int:sample_id>', methods=['GET'])
def get_sample_details(sample_id):
    sample = Sample.get_sample(sample_id)

    if not sample:
        return jsonify({"error": "Sample not found"}), 404

    labels = []
    try:
        with open(sample.label_path, 'r') as label_file:
            for line in label_file.readlines():
                parts = line.strip().split()
                if len(parts) >= 6:
                    label = {
                        "class_id": int(parts[0]),
                        "polygon": [
                            (float(parts[i]), float(parts[i + 1])) for i in range(1, len(parts), 2)
                        ]
                    }
                    labels.append(label)
    except Exception as e:
        return jsonify({"error": "Error reading label file", "message": str(e)}), 500

    return jsonify({
        "sample_id": sample.sample_id,
        "image_path": sample.image_path,
        "labels": labels
    }), 200


@sample_bp.route('/samples/<int:sample_id>', methods=['PUT'])
def update_sample(sample_id):
    sample = Sample.get_sample(sample_id)

    if not sample:
        return jsonify({"error": "Sample not found"}), 404

    if 'label' not in request.files:
        return jsonify({"error": "No label file part"}), 400

    label_file = request.files['label']

    if label_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    label_file.save(sample.label_path)

    return jsonify({"message": "Sample label updated successfully"}), 200


@sample_bp.route('/samples/<int:sample_id>', methods=['DELETE'])
def delete_sample(sample_id):
    sample = Sample.get_sample(sample_id)
    if not sample:
        return jsonify({"error": "Sample not found"}), 404

    Sample.delete_sample(sample_id)

    return jsonify({"message": "Sample deleted successfully"}), 200
