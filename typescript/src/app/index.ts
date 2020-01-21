import { RedisClient, ClientOpts } from 'redis'
import { IChannelInfo } from './models/channel-info.interface'
import { IChannelContainer } from './models/channel-container.interface'
import retrieveIp from 'retrieve-ip'
import EventEmitter from 'events'
import { IChannelIdentifier } from './models/channel-identifier.interface'
import { ConstructionValidator } from './construction-validator'
import { PubSubMaker } from './pub-sub-maker'

/**
 * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
 * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
 */
export default class JobRequestor {
  /**
   * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
   * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
   * @param channels An array of IChannelInfo to which the JobRequestor may need to post
   * @param [publisher] Optional.  If it is not provided, the 'options' paramter must be given.  A RedisClient instance that is NOT set as a subscriber
   * @param [subscriber] Optional. If it is not provided, but publisher is, it will be duplicated from the publisher.  If publisher is not provided, then the
   * 'options' parameter must be given.
   * @param [options] Optional.  If it is not provided, then the 'publisher' parameter must be given.  The Redis.ClientOpts to use to create the RedisClient.
   */
  constructor(
    private channels: IChannelInfo[],
    publisher?: RedisClient,
    subscriber?: RedisClient,
    options?: ClientOpts
  ) {
    // Calls validatePubSub to make sure that either the publisher or options parameters were given and valid.  If not,
    // this will throw an error
    ;[this.publisher, this.subscriber] = this.constructionValidator.validatePubSub(
      publisher,
      subscriber,
      options
    )
    // Fill the channel list with all the channels that should be subscribed to/published to
    this.channelContainer = this.constructionValidator.fillChannelContainer(this.channels)
    const channelList = Object.keys(this.channelContainer)
    channelList.forEach(channel => {
      const channelSubName = channel + '-sub'
      const channelPubName = channel + '-pub'
      this.pubSubLinks[channelPubName] = channelSubName
      this.subPubLinks[channelSubName] = channelPubName
      // subscribe to all the channels in the list
      this.subscriber.subscribe(channel)
    })
  }
  private constructionValidator: ConstructionValidator = new ConstructionValidator()
  /**
   * Response notifier of job requestor.  You must be subscribed to this event emitter's "accepted" event to
   * receive notification that a job has been accepted.  The data that is passed back is the identifying information from the acceptor of the job.
   */
  public responseNotifier = new EventEmitter()
  private publisher: RedisClient
  private subscriber: RedisClient
  private ipAddress: string = retrieveIp('IPv6', 'all', false, 1)[0]
  private jobCount: number = 0
  private subPubLinks: { [key: string]: string } = {}
  private pubSubLinks: { [key: string]: string } = {}

  private channelContainer: IChannelContainer

  /**
   * Publishes jobs as requested in the job type with the given
   * Once the job has been requested, it causes responseNotifier to emit an 'accepted' event containing the identifying info for the
   * job acceptor
   * @param jobType The job that should be posted.
   */
  public publishJob(jobType: string) {
    const jobId = `${jobType} - ${this.ipAddress} - ${++this.jobCount}`
    const identifier: IChannelIdentifier = {
      requesterIp: this.ipAddress,
      responderIp: this.ipAddress,
      jobId,
      params: ''
    }
    const channel = this.channelContainer[jobType]
    if (!channel)
      throw new Error('That job type does not exist in the channel list given at construction.')
    const pubChannel = channel + '-pub'
    const subChannel = channel + '-sub'
    const pubSubMaker: PubSubMaker = new PubSubMaker(
      this.publisher,
      this.subscriber,
      pubChannel,
      subChannel,
      identifier
    )
    pubSubMaker.listenForAcceptors()

    const callForAcceptors: NodeJS.Timeout = setInterval(
      () => this.publisher.publish(pubChannel, JSON.stringify(identifier)),
      channel.reRequest ? channel.reRequest : 5000
    )
    pubSubMaker.responseNotifier.on('accepted', messageAsObj => {
      clearInterval(callForAcceptors)
      this.responseNotifier.emit('accepted', messageAsObj)
    })
  }
}
