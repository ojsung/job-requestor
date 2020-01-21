export interface IChannelIdentifier {
  requesterIp: string
  responderIp: string
  targetIp?: string
  jobId: string
  params:
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | Array<string | number | bigint | boolean | null | undefined>
}
