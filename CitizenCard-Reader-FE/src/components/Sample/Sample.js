import { Alert, Col, List, Row, Spin, Tag, Typography } from 'antd';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { LABELS } from '../../config/constants';
import { fetchSample } from '../../redux/sampleSlice';

const { Title } = Typography;

function Sample() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { sample, loading, error } = useSelector((state) => state.samples);
    const canvasRef = useRef(null);

    useEffect(() => {
        dispatch(fetchSample(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (sample?.labels && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.src = `http://localhost:5000/${sample.image_path}`;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);

                sample.labels.forEach((label) => {
                    const labelInfo = LABELS[label.class_id];

                    if (!labelInfo) return;

                    ctx.beginPath();
                    ctx.strokeStyle = labelInfo.color;
                    ctx.lineWidth = Math.max(canvas.width, canvas.height) * 0.003;

                    label.polygon.forEach((point, index) => {
                        const x = point[0] * img.width;
                        const y = point[1] * img.height;
                        if (index === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    });
                    ctx.closePath();
                    ctx.stroke();

                    const [x, y] = label.polygon[0];
                    ctx.fillStyle = labelInfo.color;
                    const fontSize = canvas.width * 0.02;
                    ctx.font = `${fontSize}px Arial`;
                    ctx.fillText(labelInfo.name, x * img.width, y * img.height - 5);
                });
            };
        }
    }, [sample]);

    if (loading) return <Spin size="large" tip="Loading..." />;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;

    return (
        <div style={{ padding: '20px', maxHeight: '100vh' }}>
            <Row gutter={[16, 16]} align="top">
                <Col xs={24} md={12}>
                    <Title level={4}>Ảnh mẫu</Title>
                    <canvas ref={canvasRef} style={{ width: '100%', border: '1px solid #ccc' }} />
                </Col>

                <Col xs={24} md={12}>
                    <Title level={4}>Thông tin nhãn</Title>
                    <List
                        bordered
                        dataSource={sample?.labels || []}
                        renderItem={(label) => {
                            const labelInfo = LABELS[label.class_id];
                            return (
                                <List.Item>
                                    {labelInfo ? (
                                        <>
                                            <Tag color={labelInfo.color}>{labelInfo.name}</Tag>
                                            <div>
                                                <strong>Tọa độ polygon:</strong>
                                                <ul>
                                                    {label.polygon.map((point, idx) => (
                                                        <li key={idx}>
                                                            ({point[0].toFixed(2)}, {point[1].toFixed(2)})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    ) : (
                                        <Tag color="red">Unknown Label</Tag>
                                    )}
                                </List.Item>
                            );
                        }}
                        style={{ maxHeight: '80vh', overflowY: 'auto' }}
                    />
                </Col>
            </Row>
        </div>
    );
}

export default Sample;
