/// <reference types="node" />
import { IChannelIdentifier } from './models/channel-identifier.interface';
import { RedisClient } from 'redis';
import { EventEmitter } from 'events';
/**
 * This class will handle the callbacks for a single job posting to the Redis messaging system.
 */
export declare class PubSubMaker {
    private publisher;
    private subscriber;
    private pubChannel;
    private subChannel;
    private identifier;
    /**
     * This class will handle the callbacks for a single job posting to the Redis messaging system.
     * @param publisher  Redis Client set as a publisher
     * @param subscriber Redis Client set as a subscriber
     * @param pubChannel The channel to which the publisher should publish its job postings
     * @param subChannel The channel to which the subscriber shoud listen for job posting responses
     * @param identifier The identifying information for the job itself
     */
    constructor(publisher: RedisClient, subscriber: RedisClient, pubChannel: string, subChannel: string, identifier: IChannelIdentifier);
    readonly responseNotifier: EventEmitter;
    private deleteTargetIp;
    private callbackTracker;
    /**
     * This is the only public method for this class.  It creates a dynamically named callback function, and then adds it as a
     * listener to the 'message' event on the subscriber.
     */
    listenForAcceptors(): void;
    /**
     * Creates a listener for the subscriber redis client.  Emits an "accepted" event on the class instance's responseNotifier
     * event emitter when the job has been accepted.  Also emits the IChannelIdentifier object for the job acceptor.
     * @param responseChannel This is passed by the subscriber's "message" event.  The name of the channel where the job was heard
     * @param message This is passed by the subscriber's "message" event.  The message that was sent.  Should be parseable into JSON.
     */
    private subscriberListener;
    /**
     * Generates a timeout that deletes the targetIP.  Used to make sure that a job gets accepted in a timely manner
     * @returns
     */
    private targetIpDeleter;
    private respondToReporters;
    private respondToAcceptors;
}
