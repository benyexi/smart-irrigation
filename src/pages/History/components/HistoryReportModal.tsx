import { Button, Form, Modal, Select } from 'antd';
import LiteDateRange from '../../../components/Inputs/LiteDateRange';

interface HistoryReportModalProps {
  open: boolean;
  generating: boolean;
  siteOptions: Array<{ value: string; label: string }>;
  onCancel: () => void;
  onGenerate: () => void;
}

const HistoryReportModal = ({
  open,
  generating,
  siteOptions,
  onCancel,
  onGenerate,
}: HistoryReportModalProps) => (
  <Modal
    title="生成灌溉报告"
    open={open}
    onCancel={onCancel}
    footer={[
      <Button key="cancel" onClick={onCancel}>
        取消
      </Button>,
      <Button key="gen" type="primary" loading={generating} onClick={onGenerate}>
        生成并下载
      </Button>,
    ]}
  >
    <Form layout="vertical" style={{ marginTop: 16 }}>
      <Form.Item
        label="报告类型"
      >
        <Select
          defaultValue="daily"
          options={[
            { value: 'daily', label: '日报' },
            { value: 'weekly', label: '周报' },
            { value: 'monthly', label: '月报' },
          ]}
        />
      </Form.Item>
      <Form.Item label="站点">
        <Select defaultValue="site001" options={siteOptions} />
      </Form.Item>
      <Form.Item label="时间范围">
        <LiteDateRange />
      </Form.Item>
    </Form>
  </Modal>
);

export default HistoryReportModal;
