import { RedisClient } from 'redis'
import { EventEmitter } from 'events'
import { IChannelIdentifier, IMessageCallback } from 'base-job-handler'

/**
 * This class will handle the callbacks for a single job posting to the Redis messaging system.
 */
export class PubSubMaker {
  /**
   * This class will handle the callbacks for a single job posting to the Redis messaging system.
   * @param publisher  Redis Client set as a publisher
   * @param subscriber Redis Client set as a subscriber
   * @param pubChannel The channel to which the publisher should publish its job postings
   * @param subChannel The channel to which the subscriber shoud listen for job posting responses
   * @param identifier The identifying information for the job itself
   */
  constructor(
    private readonly publisher: RedisClient,
    private readonly subscriber: RedisClient,
    private readonly pubChannel: string,
    private readonly subChannel: string,
    private readonly identifier: IChannelIdentifier
  ) {}

  public readonly responseNotifier: EventEmitter = new EventEmitter()

  // I would like to leave this undefined, but my linter is complaining about it. Don't @ me
  private deleteTargetIp: NodeJS.Timeout = setTimeout(() => {}, 0)

  // This will hold the listener function for subscriptions.  It is needed to allow dynamic function naming
  // so that listeners can be deleted by name later without deleting all listeners
  private callbackTracker: { [key: string]: (param1: string, param2: string) => void } = {}

  /**
   * This is the only public method for this class.  It creates a dynamically named callback function, and then adds it as a
   * listener to the 'message' event on the subscriber.
   */
  public listenForAcceptors() {
    const newListener: IMessageCallback = (responseChannel: string, message: string) =>
      this.subscriberListener(responseChannel, message)
    Object.defineProperty(newListener, 'name', {
      value: this.identifier.jobId,
      writable: false,
      enumerable: false,
      configurable: true
    })
    this.callbackTracker[this.identifier.jobId] = newListener

    this.subscriber.on('message', this.callbackTracker[this.identifier.jobId])
  }

  /**
   * Creates a listener for the subscriber redis client.  Emits an "accepted" event on the class instance's responseNotifier
   * event emitter when the job has been accepted.  Also emits the IChannelIdentifier object for the job acceptor.
   * @param responseChannel This is passed by the subscriber's "message" event.  The name of the channel where the job was heard
   * @param message This is passed by the subscriber's "message" event.  The message that was sent.  Should be parseable into JSON.
   */
  private subscriberListener(responseChannel: string, message: string) {
    const messageAsObj: IChannelIdentifier = JSON.parse(message)
    // Make sure that the response is meant for this specific listener
    if (responseChannel === this.subChannel && messageAsObj.jobId === this.identifier.jobId) {
      // If this job has not yet been by anyone, the targetIp will be empty.  If the targetIp is already filled, we don't care about the message.
      if (!this.identifier.targetIp && messageAsObj.params === 'reporting') {
        this.identifier.targetIp = messageAsObj.responderIp
        this.respondToReporters(this.pubChannel)
        // In the case of timeouts (like if the acceptor accepted a different job), the parent will handle rerequesting.
        // This class just needs to make sure its identifier's targetIp is clear so that it is ready to accept another job.
        if (this.deleteTargetIp) clearTimeout(this.deleteTargetIp)
        this.deleteTargetIp = this.targetIpDeleter()
      }
      if (
        messageAsObj.params === 'accepting' &&
        this.identifier.targetIp &&
        this.identifier.targetIp === messageAsObj.responderIp &&
        this.identifier.jobId === messageAsObj.jobId
      ) {
        // Acknowledge that the job has been accepted, and emit the acceptor's identifying information object.
        if (this.deleteTargetIp) clearTimeout(this.deleteTargetIp)
        this.respondToAcceptors(this.pubChannel)
        // Now that we've received the response telling us the job has been accepted, we can remove our listener
        this.subscriber.removeListener('message', this.callbackTracker[this.identifier.jobId])
        this.responseNotifier.emit('accepted', messageAsObj)
      }
    }
  }

  /**
   * Generates a timeout that deletes the targetIP.  Used to make sure that a job gets accepted in a timely manner
   * @returns
   */
  private targetIpDeleter() {
    return setTimeout(() => delete this.identifier.targetIp, 3000)
  }

  // Send out a message to a responder, whose targetIp is now written on the identifier.  Sends the message "accept"
  private respondToReporters(pubChannel: string) {
    const acceptanceIdentifier = { ...this.identifier, params: 'accept' }
    this.publisher.publish(pubChannel, JSON.stringify(acceptanceIdentifier))
  }

  // Send out a message to the responder, acknowledging that they have accepted the job.  Sends the message "confirmed"
  private respondToAcceptors(pubChannel: string) {
    const confirmationIdentifier = { ...this.identifier, params: 'confirmed' }
    this.publisher.publish(pubChannel, JSON.stringify(confirmationIdentifier))
  }
}
