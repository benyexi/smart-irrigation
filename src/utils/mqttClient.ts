import type { IClientOptions, MqttClient } from 'mqtt';

export type MqttStatus = 'connected' | 'disconnected';

export type MqttMessage = {
  topic: string;
  payloadText: string;
  payload: unknown;
  timestamp: number;
};

const DEFAULT_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';

type MqttHandler = (msg: MqttMessage) => void;
type SubscribeOptions = {
  autoConnect?: boolean;
};

type HandlerSet = Set<MqttHandler>;

const topicHandlers = new Map<string, HandlerSet>();
const statusListeners = new Set<(status: MqttStatus) => void>();
let mqttModulePromise: Promise<typeof import('mqtt')> | null = null;

let client: MqttClient | null = null;
let status: MqttStatus = 'disconnected';
let brokerUrl = DEFAULT_BROKER_URL;
let connectPromise: Promise<void> | null = null;
let connectToken = 0;
const activeSubscriptions = new Set<string>();

const notifyStatus = (nextStatus: MqttStatus) => {
  if (status === nextStatus) {
    return;
  }

  status = nextStatus;
  statusListeners.forEach((listener) => {
    listener(status);
  });
};

const toPayloadText = (payload: unknown): string => {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload instanceof Uint8Array) {
    return new TextDecoder().decode(payload);
  }

  if (payload instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(payload));
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

const parsePayload = (payloadText: string): unknown => {
  try {
    return JSON.parse(payloadText);
  } catch {
    return payloadText;
  }
};

const createMessage = (topic: string, payload: unknown): MqttMessage => {
  const payloadText = toPayloadText(payload);
  return {
    topic,
    payloadText,
    payload: parsePayload(payloadText),
    timestamp: Date.now(),
  };
};

const normalizeTopic = (value: string): string => value.trim();

const loadMqttModule = async () => {
  if (!mqttModulePromise) {
    mqttModulePromise = import('mqtt');
  }

  return mqttModulePromise;
};

const releaseClient = (preserveHandlers: boolean) => {
  if (client) {
    client.removeAllListeners();
    client.end(true);
  }

  client = null;
  connectPromise = null;
  connectToken += 1;
  activeSubscriptions.clear();
  notifyStatus('disconnected');

  if (!preserveHandlers) {
    topicHandlers.clear();
  }
};

const ensureClientEventBridge = (currentClient: MqttClient) => {
  currentClient.removeAllListeners('message');
  currentClient.removeAllListeners('connect');
  currentClient.removeAllListeners('close');
  currentClient.removeAllListeners('offline');
  currentClient.removeAllListeners('error');

  currentClient.on('connect', () => {
    notifyStatus('connected');
    topicHandlers.forEach((_, topic) => {
      activeSubscriptions.add(topic);
      currentClient.subscribe(topic, { qos: 0 }, () => {
        // Subscription acknowledgements are intentionally ignored here.
      });
    });
  });

  const onDisconnect = () => {
    activeSubscriptions.clear();
    notifyStatus('disconnected');
  };

  currentClient.on('close', onDisconnect);
  currentClient.on('offline', onDisconnect);
  currentClient.on('error', onDisconnect);
  currentClient.on('message', (topic: string, payload: unknown) => {
    const message = createMessage(topic, payload);

    topicHandlers.forEach((handlers, filter) => {
      if (!topicMatches(filter, topic)) {
        return;
      }

      handlers.forEach((handler) => {
        handler(message);
      });
    });
  });
};

const ensureConnected = async (): Promise<void> => {
  if (status === 'connected' && client) {
    return;
  }

  if (connectPromise) {
    return connectPromise;
  }

  if (client && status === 'disconnected') {
    releaseClient(true);
  }

  await connectMqtt(brokerUrl);
};

export const connectMqtt = async (nextBrokerUrl: string = DEFAULT_BROKER_URL): Promise<void> => {
  const normalizedBrokerUrl = nextBrokerUrl.trim() || DEFAULT_BROKER_URL;

  if (client && status === 'connected' && brokerUrl === normalizedBrokerUrl) {
    return;
  }

  if (connectPromise && brokerUrl === normalizedBrokerUrl) {
    return connectPromise;
  }

  if (client && brokerUrl !== normalizedBrokerUrl) {
    releaseClient(true);
  }

  brokerUrl = normalizedBrokerUrl;
  const currentToken = ++connectToken;
  const mqtt = await loadMqttModule();

  connectPromise = new Promise<void>((resolve, reject) => {
    const options: IClientOptions = {
      clean: true,
      reconnectPeriod: 0,
      connectTimeout: 10_000,
      resubscribe: false,
    };

    const nextClient = mqtt.connect(brokerUrl, options);
    client = nextClient;
    ensureClientEventBridge(nextClient);

    const onReady = () => {
      if (connectToken !== currentToken) {
        resolve();
        return;
      }

      notifyStatus('connected');
      resolve();
    };

    const onFail = (error: Error) => {
      if (connectToken !== currentToken) {
        return;
      }

      releaseClient(true);
      reject(error);
    };

    nextClient.once('connect', onReady);
    nextClient.once('error', onFail);
  }).finally(() => {
    if (connectToken === currentToken) {
      connectPromise = null;
    }
  });

  return connectPromise;
};

export const disconnectMqtt = (): void => {
  releaseClient(true);
};

export const getMqttStatus = (): MqttStatus => status;

export const getMqttBrokerUrl = (): string => brokerUrl;

export const subscribeMqtt = (
  topic: string,
  handler: MqttHandler,
  options: SubscribeOptions = {},
): (() => void) => {
  const filter = normalizeTopic(topic);
  const handlers = topicHandlers.get(filter) ?? new Set<MqttHandler>();
  handlers.add(handler);
  topicHandlers.set(filter, handlers);
  const { autoConnect = true } = options;

  if (autoConnect) {
    void ensureConnected().then(() => {
      if (!client || status !== 'connected') {
        return;
      }

      if (!activeSubscriptions.has(filter)) {
        activeSubscriptions.add(filter);
        client.subscribe(filter, { qos: 0 }, () => {
          // Subscription acknowledgements are intentionally ignored here.
        });
      }
    });
  } else if (client && status === 'connected' && !activeSubscriptions.has(filter)) {
    activeSubscriptions.add(filter);
    client.subscribe(filter, { qos: 0 }, () => {
      // Subscription acknowledgements are intentionally ignored here.
    });
  }

  return () => {
    unsubscribeMqtt(filter, handler);
  };
};

export const unsubscribeMqtt = (topic: string, handler?: MqttHandler): void => {
  const filter = normalizeTopic(topic);
  const handlers = topicHandlers.get(filter);

  if (!handlers) {
    return;
  }

  if (handler) {
    handlers.delete(handler);
  } else {
    handlers.clear();
  }

  if (handlers.size > 0) {
    topicHandlers.set(filter, handlers);
    return;
  }

  topicHandlers.delete(filter);
  activeSubscriptions.delete(filter);

  if (client && status === 'connected') {
    client.unsubscribe(filter, () => {
      // Unsubscribe acknowledgements are intentionally ignored here.
    });
  }
};

export const publishMqtt = async (topic: string, payload: unknown): Promise<void> => {
  await ensureConnected();

  const currentClient = client;
  if (!currentClient || status !== 'connected') {
    throw new Error('MQTT client is not connected.');
  }

  const payloadText = typeof payload === 'string' ? payload : toPayloadText(payload);
  await new Promise<void>((resolve, reject) => {
    currentClient.publish(topic, payloadText, { qos: 0, retain: false }, (error?: Error | null) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

export const topicMatches = (filter: string, topic: string): boolean => {
  const filterParts = normalizeTopic(filter).split('/');
  const topicParts = normalizeTopic(topic).split('/');

  let topicIndex = 0;

  for (let filterIndex = 0; filterIndex < filterParts.length; filterIndex += 1) {
    const filterPart = filterParts[filterIndex];

    if (filterPart === '#') {
      return filterIndex === filterParts.length - 1;
    }

    if (topicIndex >= topicParts.length) {
      return false;
    }

    if (filterPart !== '+' && filterPart !== topicParts[topicIndex]) {
      return false;
    }

    topicIndex += 1;
  }

  return topicIndex === topicParts.length;
};

export const addMqttStatusListener = (listener: (status: MqttStatus) => void): (() => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};
