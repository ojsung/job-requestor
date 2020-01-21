import { ClientOpts, RedisClient } from 'redis';
import { IChannelInfo } from './models/channel-info.interface';
import { IChannelContainer } from './models/channel-container.interface';
/**
 * Makes sure that either the options or publisher and subscriber are defined.
 */
export declare class ConstructionValidator {
    /**
     * Makes sure that either the options or publisher and subscriber are defined.
     * @param publisher A redis client that is set as a publisher
     * @param subscriber A redis client tha tis set as a subscriber
     * @param options The client options for the redis client to allow RedisClients to be created
     * @returns An array containing a valid publisher and subscriber
     */
    validatePubSub(publisher: RedisClient | undefined, subscriber: RedisClient | undefined, options: ClientOpts | undefined): RedisClient[];
    /**
     * Fills channel container using the IChannelInfo object given to the constructor.  Also makes sure that the
     * timeout and rerequest times are valid
     * @param channels The array of IChannelInfo
     * @returns channel container where the keys are the names of the channels, and the values are objects containing the
     * connection information for each channel
     */
    fillChannelContainer(channels: IChannelInfo[]): IChannelContainer;
}
