import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Image, Modal, Space, Table } from 'antd';
import className from 'classnames/bind';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deleteSample, fetchSamples } from '../../redux/sampleSlice';
import styles from './Samples.module.scss';

const cx = className.bind(styles);

function Samples() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { samples, totalSamples, loading, success } = useSelector((state) => state.samples);

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('size')) || 10;

    useEffect(() => {
        dispatch(fetchSamples({ page: currentPage - 1, size: pageSize }));
    }, [currentPage, pageSize]);

    useEffect(() => {
        if (success) {
            dispatch(fetchSamples({ page: currentPage - 1, size: pageSize }));
        }
    }, [success]);

    const handleShowConfirmDelete = (id) => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn xóa mẫu này không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: () => {
                dispatch(deleteSample(id));
            },
        });
    };

    const handleTableChange = (pagination) => {
        const { current, pageSize } = pagination;
        setSearchParams({ page: current, size: pageSize });
        dispatch(fetchSamples({ page: current - 1, size: pageSize }));
    };

    const columns = [
        {
            title: 'STT',
            key: 'no',
            render: (text, record, index) => index + 1 + (currentPage - 1) * pageSize,
        },
        {
            title: 'Ảnh',
            key: 'image',
            dataIndex: 'image_path',
            render: (text, record) => <Image src={`http://localhost:5000/${record.image_path}`} width={100} />,
        },
        {
            title: 'Ngày tạo',
            key: 'createdAt',
            dataIndex: 'create_at',
            render: (text, record) => new Date(record.create_at).toLocaleString(),
        },
        {
            title: 'Tác vụ',
            key: 'actions',
            fixed: 'right',
            render: (text, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => navigate(`/sample/${record.sample_id}`)}>
                        Xem
                    </Button>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/update-sample/${record.sample_id}`)}
                    >
                        Sửa
                    </Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleShowConfirmDelete(record.sample_id)}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/add-sample')}>
                    Thêm mẫu
                </Button>
            </Space>
            <Table
                dataSource={samples}
                columns={columns}
                rowKey={'sample_id'}
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalSamples,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '30'],
                    onChange: (page, pageSize) => handleTableChange({ current: page, pageSize: pageSize }),
                }}
            />
        </div>
    );
}

export default Samples;
