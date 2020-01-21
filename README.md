# job-requestor

Subscribes to Redis pubsub channels to post job requests. Manages awaiting the messages, and re-requesting.

## Usage

The default export of this package is the "JobRequestor" class.
The class has a public method called `publishJob` and a public property called `responseNotifier`, which is an event emitter.
The class does not have any static methods/properties.

### Interfaces

#### IChannelInfo

```typescript
{
  "jobType": string,
  "channel"?: string,
  "timeout"?: number,
  "reRequest"?: number
}
```

#### IChannelIdentifier

```typescript
{
  "requesterIp": string,
  "responderIp": string,
  "targetIp"?: string,
  "jobId": string,
  "params": string | number | bigint | boolean | null | undefined | Array<string | number | bigint | boolean | null | undefined>
}
```

#### IChannelContainer

```typescript
{
  [key: string]: {
    "channel": string,
    "timeout"?: number,
    "reRequest"?: number
  }
}
```

### Creating an instance of the class

The constructor takes the following parameters:

```typescript
/**
 * JobRequestor is in charge of receiving job requests and posting them to the Redis messaging server.
 * In order to know when a job is properly accepted, you must be subscribed to jobRequestorInstance.responseNotifier's "accepted" event.
 * @param channels An array of IChannelInfo to which the JobRequestor may need to post
 * @param [publisher] Optional.  If it is not provided, the 'options' paramter must be given.  A RedisClient instance that is NOT set as a subscriber
 * @param [subscriber] Optional. If it is not provided, but publisher is, it will be duplicated from the publisher.  If publisher is not provided, then the
 * 'options' parameter must be given.
 * @param [options] Optional.  If it is not provided, then the 'publisher' parameter must be given.  The Redis.ClientOpts to use to create the RedisClient.
 */
```

### Example

```typescript
import { createClient, ClientOpts } from 'redis'
import { JobRequestor, IChannelInfo, IChannelIdentifier } from 'job-requestor'
const channels: IChannelInfo[] = [
  {
    jobType: 'runScript',
    channel: null, // This will be set to the jobType ("runScript") since it is falsy
    timeout: 80000, // milliseconds
    reRequest: 2000 // milliseconds
  },
  {
    jobType: 'runAnotherScript',
    channel: 'otherScriptChannel'
    // timeout will default to 30000 ms
    // reRequest will default to 5000 ms
  }
]
const clientOpts: ClientOpts = {
  host: 'localhost',
  port: 3000
}
const publisher = createClient(clientOpts)
const jobRequestor: JobRequestor = new JobRequestor(channels, publisher)
jobRequestor.responseNotifier.on('accepted', (identifier: IChannelIdentifier) => {
  const channel = identifier.channel
  if (channel === 'runScript') {
    const doSomething = ''
  } else if (channel === 'otherScriptChannel') {
    const doSomethingElse = ''
  }
})
jobRequestor.publishJob('runScript')
jobRequestor.publishJob('runAnotherScript')
```
