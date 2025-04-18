import { type Address, type Hex, type Prettify, isAddressEqual } from "viem"
import {
  type EntryPointVersion,
  type GetPaymasterDataParameters,
  type GetPaymasterStubDataReturnType,
  entryPoint06Address
} from "viem/account-abstraction"
import { deepHexlify } from "@zerodev/sdk";
import type { CandidePaymasterClient } from "./client.ts";

export type SponsorUserOperationParameters = {
  userOperation: GetPaymasterDataParameters
  sponsorshipPolicyId?: string
}

export type SponsorUserOperationReturnType = Prettify<
  GetPaymasterStubDataReturnType & {
    maxFeePerGas?: bigint | undefined
    maxPriorityFeePerGas?: bigint | undefined
    callGasLimit?: bigint | undefined
    verificationGasLimit?: bigint | undefined
    preVerificationGas?: bigint | undefined
  }
>

/**
 * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
 */
export const sponsorUserOperation = async <
  entryPointVersion extends EntryPointVersion
>(
  client: CandidePaymasterClient<entryPointVersion>,
  args: SponsorUserOperationParameters
): Promise<SponsorUserOperationReturnType> => {
  if (!args.userOperation.callGasLimit) {
    args.userOperation.callGasLimit = 0n;
  }
  if (!args.userOperation.verificationGasLimit) {
    args.userOperation.verificationGasLimit = 0n;
  }
  if (!args.userOperation.preVerificationGas) {
    args.userOperation.preVerificationGas = 0n;
  }
  const {
    userOperation: {
      entryPointAddress,
      ..._userOperation
    }
  } = args
  const context: Record<string, string> = {};
  if (args.sponsorshipPolicyId) {
    context["sponsorshipPolicyId"] = args.sponsorshipPolicyId;
  }
  const response = await client.request({
    method: "pm_sponsorUserOperation",
    params: [
      deepHexlify(_userOperation),
      entryPointAddress,
      context
    ]
  })
  if (isAddressEqual(entryPointAddress, entryPoint06Address)) {
    return {
      paymasterAndData: response.paymasterAndData,
      preVerificationGas: BigInt(response.preVerificationGas),
      verificationGasLimit: BigInt(response.verificationGasLimit),
      callGasLimit: BigInt(response.callGasLimit),
      maxFeePerGas: response.maxFeePerGas
        ? BigInt(response.maxFeePerGas)
        : args.userOperation.maxFeePerGas,
      maxPriorityFeePerGas: response.maxPriorityFeePerGas
        ? BigInt(response.maxPriorityFeePerGas)
        : args.userOperation.maxPriorityFeePerGas
    } as SponsorUserOperationReturnType
  }
  const responseV07 = response as {
    preVerificationGas: Hex
    verificationGasLimit: Hex
    callGasLimit: Hex
    paymaster: Address
    paymasterVerificationGasLimit: Hex
    paymasterPostOpGasLimit: Hex
    paymasterData: Hex
    maxFeePerGas?: Hex
    maxPriorityFeePerGas?: Hex
    paymasterAndData?: never
  }

  return {
    callGasLimit: BigInt(responseV07.callGasLimit),
    verificationGasLimit: BigInt(responseV07.verificationGasLimit),
    preVerificationGas: BigInt(responseV07.preVerificationGas),
    paymaster: responseV07.paymaster,
    paymasterVerificationGasLimit: BigInt(
      responseV07.paymasterVerificationGasLimit
    ),
    paymasterPostOpGasLimit: BigInt(responseV07.paymasterPostOpGasLimit),
    paymasterData: responseV07.paymasterData,
    maxFeePerGas: response.maxFeePerGas
      ? BigInt(response.maxFeePerGas)
      : args.userOperation.maxFeePerGas,
    maxPriorityFeePerGas: response.maxPriorityFeePerGas
      ? BigInt(response.maxPriorityFeePerGas)
      : args.userOperation.maxPriorityFeePerGas
  } as SponsorUserOperationReturnType
}