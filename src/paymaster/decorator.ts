import type { SponsorUserOperationReturnType } from "@zerodev/sdk";
import type { EntryPointVersion, UserOperation } from "viem/account-abstraction";
import type { Address, Hex, PartialBy } from "viem";
import type { SponsorUserOperationParameters } from "./actions";

export type CandidePaymasterClientActions = {
  /**
   * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
   */
  sponsorUserOperation: (
    args: SponsorUserOperationParameters
  ) => Promise<SponsorUserOperationReturnType>
}

export type CandidePaymasterRpcSchema<
  entryPointVersion extends EntryPointVersion
> = [
    {
      Method: "pm_sponsorUserOperation"
      Parameters: [
        entryPointVersion extends "0.6"
        ? PartialBy<
          UserOperation<"0.6">,
          | "callGasLimit"
          | "preVerificationGas"
          | "verificationGasLimit"
        >
        : PartialBy<
          UserOperation<"0.7">,
          | "callGasLimit"
          | "preVerificationGas"
          | "verificationGasLimit"
          | "paymasterVerificationGasLimit"
          | "paymasterPostOpGasLimit"
        >,
        Address,
        Record<string, string>
      ]
      ReturnType: entryPointVersion extends "0.6"
      ? {
        paymasterAndData: Hex
        preVerificationGas: Hex
        verificationGasLimit: Hex
        callGasLimit: Hex
        maxFeePerGas?: Hex
        maxPriorityFeePerGas?: Hex
        paymaster?: never
        paymasterVerificationGasLimit?: never
        paymasterPostOpGasLimit?: never
        paymasterData?: never
      }
      : {
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
    },
  ]