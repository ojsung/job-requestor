import { RedisClient, ClientOpts } from 'redis';
import BaseJobHandler, { IChannelInfo } from 'base-job-handler';
/**
 * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
 * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
 */
export declare class JobRequestor extends BaseJobHandler {
    protected readonly channels: IChannelInfo[];
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
    private jobCount;
    /**
     * Publishes jobs as requested in the job type with the given
     * Once the job has been requested, it causes responseNotifier to emit an 'accepted' event containing the identifying info for the
     * job acceptor
     * @param jobType The job that should be posted.
     */
    postJob(jobType: string): void;
}
