import { useEffect, useRef } from 'react';
import { subscribeMqtt, type MqttMessage } from '../utils/mqttClient';

type MqttMessageHandler = (message: MqttMessage) => void;
type UseMqttSubscriptionOptions = {
  autoConnect?: boolean;
};

export const useMqttSubscription = (
  topic: string | null | undefined,
  handler: MqttMessageHandler,
  enabled = true,
  options?: UseMqttSubscriptionOptions,
) => {
  const handlerRef = useRef(handler);
  const autoConnect = options?.autoConnect ?? true;

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || !topic) {
      return undefined;
    }

    return subscribeMqtt(topic, (message) => {
      handlerRef.current(message);
    }, { autoConnect });
  }, [autoConnect, enabled, topic]);
};
