export interface IChannelContainer {
  [key: string]: {
    subscribed?: boolean
    channel: string
    timeout?: number
    reRequest?: number
  }
}
