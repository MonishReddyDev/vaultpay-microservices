import * as amqplib from 'amqplib';
import { ChannelModel, Channel } from 'amqplib';
import { logger } from './logger';


class MessageBroker {
  private static instance: MessageBroker;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  private constructor() {}

  public static getInstance(): MessageBroker {
    if (!MessageBroker.instance) {
      MessageBroker.instance = new MessageBroker();
    }
    return MessageBroker.instance;
  }

  public async connect(): Promise<Channel> {
    if (this.channel) return this.channel;

    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    try {
      this.connection = await amqplib.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      logger.info('Connected to RabbitMQ successfully');
      
      this.connection.on('error', (err) => {
        logger.error({ err }, 'RabbitMQ connection error');
        this.connection = null;
        this.channel = null;
      });

      return this.channel;
    } catch (error) {
      logger.error({ error }, 'Failed to connect to RabbitMQ');
      throw error;
    }
  }

  public async publishToExchange(exchange: string, routingKey: string, message: any): Promise<boolean> {
    const channel = await this.connect();
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    const buffer = Buffer.from(JSON.stringify(message));
    return channel.publish(exchange, routingKey, buffer, { persistent: true });
  }

  public async consumeQueue(
    exchange: string, 
    queueName: string, 
    routingKey: string, 
    onMessage: (msg: any) => Promise<void>
  ) {
    const channel = await this.connect();
    
    // Setup Dead Letter Exchange (DLX) and Queue (DLQ)
    const dlxName = 'wallet.dlx';
    const dlqName = 'wallet.dlq';
    await channel.assertExchange(dlxName, 'topic', { durable: true });
    await channel.assertQueue(dlqName, { durable: true });
    // Bind the DLQ to catch all dead-lettered messages
    await channel.bindQueue(dlqName, dlxName, '#');

    // Setup main exchange and queue with DLX routing
    await channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await channel.assertQueue(queueName, { 
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxName,
        'x-dead-letter-routing-key': `dead.${queueName}`
      }
    });
    
    // Bind queue to exchange
    await channel.bindQueue(q.queue, exchange, routingKey);
    
    logger.info(`Starting consumption on queue: ${queueName}, routingKey: ${routingKey}`);

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await onMessage(content);
          channel.ack(msg);
        } catch (error) {
          logger.error({ error, messageId: msg.properties.messageId }, 'Error processing message');
          // NACK and do not requeue. Because we configured x-dead-letter-exchange,
          // RabbitMQ will automatically route this rejected message to the DLQ.
          channel.nack(msg, false, false); 
        }
      }
    });
  }
}

export const messageBroker = MessageBroker.getInstance();

// Known Exchange and Routing Key definitions for consistency across services
export const Exchanges = {
  DOMAIN_EVENTS: 'wallet.domain.events',
};

export const RoutingKeys = {
  USER_REGISTERED:       'user.registered',
  WALLET_DEBIT_REQUEST:  'wallet.debit.request',
  WALLET_CREDIT_REQUEST: 'wallet.credit.request',
  // Published by Wallet Service after every successful atomic transfer.
  // Consumed by Transaction Service to record an immutable ledger entry.
  TRANSFER_COMPLETED:    'wallet.transfer.completed',
  WALLET_CREDIT_COMPLETED: 'wallet.credit.completed',
  // Published by Wallet Service in response to wallet.debit.request events
  // from the Payment Service. Close the Choreography Saga loop.
  WALLET_DEBIT_CONFIRMED: 'wallet.debit.confirmed',
  WALLET_DEBIT_FAILED:    'wallet.debit.failed',
};
