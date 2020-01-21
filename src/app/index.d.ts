/// <reference types="node" />
import { RedisClient, ClientOpts } from 'redis';
import { IChannelInfo } from './models/channel-info.interface';
import EventEmitter from 'events';
/**
 * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
 * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
 */
export default class JobRequestor {
    private channels;
    /**
     * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
     * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
     * @param channels An array of IChannelInfo to which the JobRequestor may need to post
     * @param [publisher] Optional.  If it is not provided, the 'options' paramter must be given.  A RedisClient instance that is NOT set as a subscriber
     * @param [subscriber] Optional. If it is not provided, but publisher is, it will be duplicated from the publisher.  If publisher is not provided, then the
     * 'options' parameter must be given.
     * @param [options] Optional.  If it is not provided, then the 'publisher' parameter must be given.  The Redis.ClientOpts to use to create the RedisClient.
     */
    constructor(channels: IChannelInfo[], publisher?: RedisClient, subscriber?: RedisClient, options?: ClientOpts);
    private constructionValidator;
    /**
     * Response notifier of job requestor.  You must be subscribed to this event emitter's "accepted" event to
     * receive notification that a job has been accepted.  The data that is passed back is the identifying information from the acceptor of the job.
     */
    responseNotifier: EventEmitter;
    private publisher;
    private subscriber;
    private ipAddress;
    private jobCount;
    private subPubLinks;
    private pubSubLinks;
    private channelContainer;
    /**
     * Publishes jobs as requested in the job type with the given
     * Once the job has been requested, it causes responseNotifier to emit an 'accepted' event containing the identifying info for the
     * job acceptor
     * @param jobType The job that should be posted.
     */
    publishJob(jobType: string): void;
}
