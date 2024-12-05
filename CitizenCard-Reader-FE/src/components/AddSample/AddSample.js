import {
    BorderOutlined,
    ClearOutlined,
    DeleteOutlined,
    PicCenterOutlined,
    SaveOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, message, Radio, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { LABELS } from '../../config/constants';
import { createSample, fetchSample, updateSample } from '../../redux/sampleSlice';

const AddSample = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { sample } = useSelector((state) => state.samples);

    const [selectedLabel, setSelectedLabel] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [annotations, setAnnotations] = useState([]);
    const [annotationType, setAnnotationType] = useState('bbox');
    const [currentAnnotation, setCurrentAnnotation] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const canvasRef = useRef(null);

    useEffect(() => {
        if (id) {
            dispatch(fetchSample(id));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (id && sample) {
            setImageUrl(`http://localhost:5000/${sample.image_path}`);
            const mapAnnotions = sample.labels.map((label) => ({
                label: LABELS[label.class_id],
                points: label.polygon.map(([x, y]) => ({ x, y })),
            }));
            setAnnotations(mapAnnotions);
        }
    }, [id, sample]);

    useEffect(() => {
        setCurrentAnnotation(null);
    }, [annotationType]);

    useEffect(() => {
        if (currentAnnotation?.type === 'polygon') {
            finishPolygon();
        }
    }, [selectedLabel]);

    useEffect(() => {
        if (!imageUrl) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;

            canvas.width = imgWidth;
            canvas.height = imgHeight;

            canvasRef.current = canvas;

            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            annotations.forEach((ann) => {
                handleDrawAnnotation(ann);
            });

            if (currentAnnotation) {
                handleDrawCurrentAnnotation();
            }
        };
        img.src = imageUrl;
    }, [imageUrl, annotations, currentAnnotation]);

    const handleDrawAnnotation = (annotation) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.strokeStyle = annotation.label.color || 'red';
        ctx.lineWidth = Math.max(canvas.width, canvas.height) * 0.003;

        annotation.points.forEach((point, index) => {
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.closePath();
        ctx.stroke();

        if (annotation.type === 'polygon') {
            annotation.points.forEach((point) => {
                ctx.beginPath();
                const x = point.x * canvas.width;
                const y = point.y * canvas.height;
                ctx.fillStyle = annotation.label.color || 'red';
                ctx.arc(x, y, 4, 0, Math.PI * ctx.lineWidth * 1.5);
                ctx.fill();
            });
        }

        ctx.fillStyle = annotation.label.color || 'red';
        const fontSize = canvas.width * 0.02;
        ctx.font = `${fontSize}px Arial`;
        if (annotation.points.length > 0) {
            const x = annotation.points[0].x * canvas.width;
            const y = annotation.points[0].y * canvas.height;
            ctx.fillText(annotation.label.name, x, y - 5);
        }

        canvasRef.current = canvas;
    };

    const handleDrawCurrentAnnotation = () => {
        const annotation = { ...currentAnnotation, points: [...currentAnnotation.points, currentAnnotation.points[0]] };
        console.log(annotation);
        handleDrawAnnotation(annotation);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Bạn chỉ có thể tải ảnh!');
                return;
            }
            const url = URL.createObjectURL(file);
            setImageFile(file);
            setImageUrl(url);
            setAnnotations([]);
        }
    };

    const getRelativeCoordinates = (e) => {
        const canvas = canvasRef.current;

        const x = e.nativeEvent.offsetX / canvas.width;
        const y = e.nativeEvent.offsetY / canvas.height;

        return {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y)),
        };
    };

    const handleMouseDown = (e) => {
        if (!selectedLabel) {
            message.warning('Vui lòng chọn nhãn trước');
            return;
        }

        const { x, y } = getRelativeCoordinates(e);

        if (annotationType === 'bbox') {
            setCurrentAnnotation({
                type: 'bbox',
                label: selectedLabel,
                points: [
                    { x, y },
                    { x, y },
                ],
            });
            setIsDrawing(true);
        } else if (annotationType === 'polygon') {
            if (!currentAnnotation) {
                setCurrentAnnotation({
                    type: 'polygon',
                    label: selectedLabel,
                    points: [{ x, y }],
                });
                setIsDrawing(true);
            } else {
                const newPoints = [...currentAnnotation.points, { x, y }];
                setCurrentAnnotation({ ...currentAnnotation, points: newPoints });
            }
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;

        const { x, y } = getRelativeCoordinates(e);

        if (currentAnnotation && annotationType === 'bbox') {
            setCurrentAnnotation((prev) => {
                const { x: x0, y: y0 } = prev.points[0];
                return {
                    ...prev,
                    points: [
                        { x: x0, y: y0 },
                        { x, y: y0 },
                        { x, y },
                        { x: x0, y },
                        { x: x0, y: y0 },
                    ],
                };
            });
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;

        if (currentAnnotation.type === 'bbox') {
            setAnnotations((prev) => [...prev, currentAnnotation]);
            setCurrentAnnotation(null);
            setIsDrawing(false);
        }
    };

    const finishPolygon = () => {
        if (currentAnnotation && currentAnnotation.points.length >= 3) {
            const { x: x0, y: y0 } = currentAnnotation.points[0];
            const newAnnotation = { ...currentAnnotation, points: [...currentAnnotation.points, { x: x0, y: y0 }] };
            setAnnotations((prev) => [...prev, newAnnotation]);
            setCurrentAnnotation(null);
            setIsDrawing(false);
        }
    };

    const handleDeleteAnnotation = (index) => {
        setAnnotations((prevAnnotations) => prevAnnotations.filter((_, i) => i !== index));
    };

    const handleClearAnnotations = () => {
        setAnnotations([]);
        setCurrentAnnotation(null);
        setIsDrawing(false);
    };

    const handleSaveSample = async () => {
        if (!imageFile && !id) {
            message.warning('Vui lòng tải ảnh trước');
            return;
        }

        const canvas = canvasRef.current;

        const formattedAnnotations = annotations.map((ann) => {
            const classIndex = LABELS.findIndex((label) => label.name === ann.label.name);

            return `${classIndex} ${ann.points.map((point) => `${point.x} ${point.y}`).join(' ')}`;
        });

        const annotationText = formattedAnnotations.join('\n');
        const labelFile = new Blob([annotationText], { type: 'text/plain' });

        if (!id) dispatch(createSample({ imageFile, labelFile }));
        else dispatch(updateSample({ sampleId: id, labelFile }));
    };

    return (
        <div style={{ margin: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <Col style={{ width: '300px' }}>
                    <Card title="Nhãn" style={{ width: '100%' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Radio.Group
                                value={annotationType}
                                onChange={(e) => setAnnotationType(e.target.value)}
                                style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}
                            >
                                <Radio.Button value="bbox">
                                    <Space>
                                        <BorderOutlined /> Bbox
                                    </Space>
                                </Radio.Button>
                                <Radio.Button value="polygon">
                                    <Space>
                                        <PicCenterOutlined /> Polygon
                                    </Space>
                                </Radio.Button>
                            </Radio.Group>

                            {LABELS.map((label) => (
                                <Button
                                    key={label.name}
                                    type={selectedLabel === label ? 'primary' : 'default'}
                                    block
                                    style={{
                                        backgroundColor: selectedLabel === label ? label.color : undefined,
                                        color: selectedLabel === label ? 'white' : undefined,
                                    }}
                                    onClick={() => setSelectedLabel(label)}
                                >
                                    {label.name}
                                </Button>
                            ))}
                        </Space>
                    </Card>
                    <Card title="Nhãn đã gán" style={{ width: '100%', marginTop: '16px' }}>
                        {annotations.map((ann, index) => (
                            <Button
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span>
                                    {ann.label.name} {ann.type === 'bbox' ? `(BBox)` : `(Polygon)`}
                                </span>
                                <DeleteOutlined
                                    onClick={() => handleDeleteAnnotation(index)}
                                    style={{
                                        marginLeft: '8px',
                                        cursor: 'pointer',
                                    }}
                                />
                            </Button>
                        ))}
                    </Card>
                </Col>

                <Card
                    extra={
                        <Space>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSaveSample}
                                disabled={annotations.length === 0 || currentAnnotation}
                            >
                                Lưu mẫu
                            </Button>
                            <Button
                                danger
                                icon={<ClearOutlined />}
                                disabled={annotations.length === 0 && !currentAnnotation}
                                onClick={handleClearAnnotations}
                            >
                                Clear
                            </Button>
                            {annotationType === 'polygon' &&
                                currentAnnotation &&
                                currentAnnotation.points.length >= 3 && (
                                    <Button type="primary" onClick={finishPolygon}>
                                        Hoàn thành Polygon
                                    </Button>
                                )}
                            {!id && (
                                <Button
                                    color="primary"
                                    icon={<UploadOutlined />}
                                    onClick={() => document.getElementById('file-input').click()}
                                >
                                    Tải ảnh
                                </Button>
                            )}
                        </Space>
                    }
                >
                    {imageUrl && (
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            style={{
                                border: '1px solid #ccc',
                                cursor: 'crosshair',
                            }}
                        />
                    )}
                </Card>
            </div>
            <input
                id="file-input"
                type="file"
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
    );
};

export default AddSample;
