declare module "@fluvio/client" {
  interface FluvioRecord {
    valueString: () => string;
  }

  interface FluvioConsumer {
    stream: (callback: (record: FluvioRecord) => void) => void;
  }

  interface FluvioTopic {
    consumer: () => Promise<FluvioConsumer>;
  }

  interface FluvioClient {
    connect: () => Promise<void>;
    topic: (name: string) => FluvioTopic;
  }

  class Fluvio implements FluvioClient {
    connect(): Promise<void>;
    topic(name: string): FluvioTopic;
  }

  export default Fluvio;
} 