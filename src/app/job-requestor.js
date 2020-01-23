"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pub_sub_maker_1 = require("./pub-sub-maker");
const base_job_handler_1 = __importDefault(require("base-job-handler"));
/**
 * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
 * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
 */
class JobRequestor extends base_job_handler_1.default {
    /**
     * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
     * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
     * @param channels An array of IChannelInfo to which the JobRequestor may need to post
     * @param [publisher] Optional.  If it is not provided, the 'options' paramter must be given.  A RedisClient instance that is NOT set as a subscriber
     * @param [subscriber] Optional. If it is not provided, but publisher is, it will be duplicated from the publisher.  If publisher is not provided, then the
     * 'options' parameter must be given.
     * @param [options] Optional.  If it is not provided, then the 'publisher' parameter must be given.  The Redis.ClientOpts to use to create the RedisClient.
     */
    constructor(channels, publisher, subscriber, options) {
        super(channels, publisher, subscriber, options);
        this.channels = channels;
        this.jobCount = 0;
        // Fill the channel list with all the channels that should be subscribed to/published to
        this.channelContainer = this.constructionValidator.fillChannelContainer(this.channels);
        const channelList = Object.keys(this.channelContainer);
        channelList.forEach(channel => {
            const jobAcceptanceChannel = channel + '-accept';
            const jobPostingChannel = channel + '-post';
            this.postingToAcceptanceChannelDictionary[jobPostingChannel] = jobAcceptanceChannel;
            this.acceptanceToPostingChannelDictionary[jobAcceptanceChannel] = jobPostingChannel;
            // subscribe to all the channels in the list
            this.subscribedChannels.push(jobAcceptanceChannel);
        });
    }
    /**
     * Publishes jobs as requested in the job type with the given
     * Once the job has been requested, it causes responseNotifier to emit an 'accepted' event containing the identifying info for the
     * job acceptor
     * @param jobType The job that should be posted.
     */
    postJob(jobType) {
        this.validateSubscriptions();
        const jobId = `${jobType} - ${this.ipAddress} - ${++this.jobCount}`;
        const identifier = {
            requesterIp: this.ipAddress,
            responderIp: this.ipAddress,
            jobId,
            params: 'report'
        };
        const filledChannelContainer = this.channelContainer;
        const channel = filledChannelContainer[jobType];
        if (!channel)
            throw new Error('That job type does not exist in the channel list given at construction.');
        const pubChannel = channel + '-pub';
        const subChannel = channel + '-sub';
        const pubSubMaker = new pub_sub_maker_1.PubSubMaker(this.publisher, this.subscriber, pubChannel, subChannel, identifier);
        pubSubMaker.listenForAcceptors();
        const callForAcceptors = setInterval(() => this.publisher.publish(pubChannel, JSON.stringify(identifier)), channel.reRequest ? channel.reRequest : 5000);
        pubSubMaker.responseNotifier.on('accepted', (messageAsObj) => {
            clearInterval(callForAcceptors);
            this.responseNotifier.emit('accepted', messageAsObj);
        });
    }
}
exports.JobRequestor = JobRequestor;
//# sourceMappingURL=job-requestor.js.map