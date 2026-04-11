import { Checkbox, Switch } from 'antd';
import type { AlarmRule } from '../../../types/site';
import { dataAlarmDefs, systemAlarmDefs } from './siteModalShared';

interface SiteAlarmRulesStepProps {
  alarmRuleMap: Map<string, AlarmRule>;
  onAlarmRuleChange: (key: string, patch: Partial<AlarmRule>) => void;
}

const renderAlarmBlock = (
  title: string,
  defs: Array<{ key: string; label: string }>,
  alarmRuleMap: Map<string, AlarmRule>,
  onAlarmRuleChange: (key: string, patch: Partial<AlarmRule>) => void,
) => (
  <div className="site-alert-box">
    <div className="site-alert-title">{title}</div>
    {defs.map((item) => {
      const rule = alarmRuleMap.get(item.key) ?? { key: item.key, enabled: true, notify: ['wechat'] as const };
      return (
        <div className="site-alert-row" key={item.key}>
          <Switch
            checked={rule.enabled}
            onChange={(checked) => onAlarmRuleChange(item.key, { enabled: checked })}
          />
          <div className="site-alert-content">
            <div className="site-alert-label">{item.label}</div>
            <Checkbox.Group
              options={[
                { label: '微信', value: 'wechat' },
                { label: '短信', value: 'sms' },
                { label: '邮件', value: 'email' },
              ]}
              value={rule.notify}
              onChange={(list) => onAlarmRuleChange(item.key, { notify: list as Array<'wechat' | 'sms' | 'email'> })}
            />
          </div>
        </div>
      );
    })}
  </div>
);

const SiteAlarmRulesStep = ({
  alarmRuleMap,
  onAlarmRuleChange,
}: SiteAlarmRulesStepProps) => (
  <div className="site-alert-grid">
    {renderAlarmBlock('系统报警', systemAlarmDefs, alarmRuleMap, onAlarmRuleChange)}
    {renderAlarmBlock('数据报警', dataAlarmDefs, alarmRuleMap, onAlarmRuleChange)}
  </div>
);

export default SiteAlarmRulesStep;
