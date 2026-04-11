import { useEffect, useRef } from 'react';
import { subscribeMqtt, type MqttMessage } from '../utils/mqttClient';

type MqttMessageHandler = (message: MqttMessage) => void;

export const useMqttSubscription = (
  topic: string | null | undefined,
  handler: MqttMessageHandler,
  enabled = true,
) => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || !topic) {
      return undefined;
    }

    return subscribeMqtt(topic, (message) => {
      handlerRef.current(message);
    });
  }, [enabled, topic]);
};
