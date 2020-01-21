"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const retrieve_ip_1 = __importDefault(require("retrieve-ip"));
const events_1 = __importDefault(require("events"));
const construction_validator_1 = require("./construction-validator");
const pub_sub_maker_1 = require("./pub-sub-maker");
/**
 * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
 * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
 */
class JobRequestor {
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
        this.channels = channels;
        this.constructionValidator = new construction_validator_1.ConstructionValidator();
        /**
         * Response notifier of job requestor.  You must be subscribed to this event emitter's "accepted" event to
         * receive notification that a job has been accepted.  The data that is passed back is the identifying information from the acceptor of the job.
         */
        this.responseNotifier = new events_1.default();
        this.ipAddress = retrieve_ip_1.default('IPv6', 'all', false, 1)[0];
        this.jobCount = 0;
        this.subPubLinks = {};
        this.pubSubLinks = {};
        // Calls validatePubSub to make sure that either the publisher or options parameters were given and valid.  If not,
        // this will throw an error
        ;
        [this.publisher, this.subscriber] = this.constructionValidator.validatePubSub(publisher, subscriber, options);
        // Fill the channel list with all the channels that should be subscribed to/published to
        this.channelContainer = this.constructionValidator.fillChannelContainer(this.channels);
        const channelList = Object.keys(this.channelContainer);
        channelList.forEach(channel => {
            const channelSubName = channel + '-sub';
            const channelPubName = channel + '-pub';
            this.pubSubLinks[channelPubName] = channelSubName;
            this.subPubLinks[channelSubName] = channelPubName;
            // subscribe to all the channels in the list
            this.subscriber.subscribe(channel);
        });
    }
    /**
     * Publishes jobs as requested in the job type with the given
     * Once the job has been requested, it causes responseNotifier to emit an 'accepted' event containing the identifying info for the
     * job acceptor
     * @param jobType The job that should be posted.
     */
    publishJob(jobType) {
        const jobId = `${jobType} - ${this.ipAddress} - ${++this.jobCount}`;
        const identifier = {
            requesterIp: this.ipAddress,
            responderIp: this.ipAddress,
            jobId,
            params: ''
        };
        const channel = this.channelContainer[jobType];
        if (!channel)
            throw new Error('That job type does not exist in the channel list given at construction.');
        const pubChannel = channel + '-pub';
        const subChannel = channel + '-sub';
        const pubSubMaker = new pub_sub_maker_1.PubSubMaker(this.publisher, this.subscriber, pubChannel, subChannel, identifier);
        pubSubMaker.listenForAcceptors();
        const callForAcceptors = setInterval(() => this.publisher.publish(pubChannel, JSON.stringify(identifier)), channel.reRequest ? channel.reRequest : 5000);
        pubSubMaker.responseNotifier.on('accepted', messageAsObj => {
            clearInterval(callForAcceptors);
            this.responseNotifier.emit('accepted', messageAsObj);
        });
    }
}
exports.JobRequestor = JobRequestor;
//# sourceMappingURL=index.js.map