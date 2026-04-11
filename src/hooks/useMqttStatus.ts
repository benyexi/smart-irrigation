import { useEffect, useRef, useState } from 'react';
import { addMqttStatusListener, getMqttStatus, type MqttStatus } from '../utils/mqttClient';

export const useMqttStatus = () => {
  const [status, setStatus] = useState<MqttStatus>(() => getMqttStatus());

  useEffect(() => addMqttStatusListener(setStatus), []);

  return status;
};

export const useMqttStatusListener = (listener: (status: MqttStatus) => void) => {
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => addMqttStatusListener((status) => listenerRef.current(status)), []);
};
