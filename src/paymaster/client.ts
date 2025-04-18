import {
  type Chain,
  type Client,
  type ClientConfig,
  type Prettify,
  type RpcSchema,
  type Transport,
  createClient
} from "viem"
import {
  type PaymasterActions,
  type SmartAccount,
  type EntryPointVersion,
  paymasterActions
} from "viem/account-abstraction"
import type { SponsorUserOperationParameters } from "@zerodev/sdk";
import type { CandidePaymasterClientActions, CandidePaymasterRpcSchema } from "./decorator";
import { sponsorUserOperation } from "./actions";

export type CandidePaymasterClient<
  entryPointVersion extends "0.6" | "0.7" = "0.7",
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount | undefined = SmartAccount | undefined,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Client<
    transport,
    chain extends Chain
    ? chain
    : // biome-ignore lint/suspicious/noExplicitAny: We need any to infer the chain type
    client extends Client<any, infer chain>
    ? chain
    : undefined,
    account,
    rpcSchema extends RpcSchema
    ? [...CandidePaymasterRpcSchema<entryPointVersion>, ...rpcSchema]
    : CandidePaymasterRpcSchema<entryPointVersion>,
    PaymasterActions & CandidePaymasterClientActions
  >
>

export type CandidePaymasterClientConfig<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount | undefined = SmartAccount | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Pick<
    ClientConfig<transport, chain, account, rpcSchema>,
    | "account"
    | "cacheTime"
    | "chain"
    | "key"
    | "name"
    | "pollingInterval"
    | "rpcSchema"
    | "transport"
  >
>

export const candidePaymasterActions =
  <entryPointVersion extends EntryPointVersion>() =>
    (client: Client): CandidePaymasterClientActions => ({
      sponsorUserOperation: async (args: SponsorUserOperationParameters) =>
        sponsorUserOperation(
          client as CandidePaymasterClient<entryPointVersion>,
          {
            ...args
          }
        ),
    })

export const createCandidePaymasterClient = (
  parameters: CandidePaymasterClientConfig
): CandidePaymasterClient => {
  const {
    key = "public",
    name = "Candide Paymaster Client",
    transport
  } = parameters
  const client = createClient({
    ...parameters,
    transport: (opts) => {
      return transport({
        ...opts,
        retryCount: 0
      })
    },
    key,
    name,
    type: "candidePaymasterClient"
  })
  return client.extend(paymasterActions).extend(candidePaymasterActions())
}