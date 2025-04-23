import Fluvio from "@fluvio/client";
import Redis from "ioredis";

interface QueryEvent {
  userId: string;
  topic: string;
  latex: string;
  formulaType: string;
  timestamp: number;
}

interface FluvioRecord {
  valueString: () => string;
}

interface FluvioTopic {
  consumer: () => Promise<FluvioConsumer>;
}

interface FluvioConsumer {
  stream: (callback: (record: FluvioRecord) => void) => void;
}

const start = async () => {
  try {
    // Create Redis client
    const redis = new Redis();
    console.log("Connected to Redis");

    // Connect to Fluvio
    const fluvio = new Fluvio();
    await fluvio.connect();
    console.log("Connected to Fluvio");

    // Create consumer for math_queries topic
    const topic = fluvio.topic("math_queries") as FluvioTopic;
    const consumer = await topic.consumer();
    console.log("Created consumer for math_queries topic");

    // Stream data from Fluvio and publish to Redis
    consumer.stream((record: FluvioRecord) => {
      const data = record.valueString();
      console.log("Received data from Fluvio:", data);

      // Publish to Redis channel
      redis.publish("math_events", data);
      
      // Store in Redis list
      redis.lpush("math_queries", data);
    });

  } catch (error) {
    console.error("Error in Fluvio consumer:", error);
    process.exit(1);
  }
};

start(); 