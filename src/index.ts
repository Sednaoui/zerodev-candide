import * as dotenv from "dotenv";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk"
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { http, createPublicClient, zeroAddress } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { arbitrumSepolia } from "viem/chains"
import { estimateFeesPerGas } from "viem/actions"

import { createCandidePaymasterClient } from "./paymaster/client"
import { SponsorUserOperationReturnType } from "./paymaster/actions"



const chain = arbitrumSepolia
const entryPoint = getEntryPoint("0.7")
const kernelVersion = KERNEL_V3_1

const main = async () => {
    dotenv.config();
    const nodeUrl = process.env.NODE_URL;
    const bundlerUrl = process.env.BUNDLER_URL;
    const paymasterUrl = process.env.PAYMASTER_URL;
    const sponsorshipPolicyId = process.env.SPONSORSHIP_POLICY_ID;

    const privateKey = generatePrivateKey()
    const signer = privateKeyToAccount(privateKey)

    // Construct a public client
    const publicClient = createPublicClient({
        transport: http(nodeUrl),
        chain
    })

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer,
        entryPoint,
        kernelVersion
    })

    const account = await createKernelAccount(publicClient, {
        plugins: {
            sudo: ecdsaValidator,
        },
        entryPoint,
        kernelVersion
    })

    const paymaster = createCandidePaymasterClient({
        chain,
        transport: http(paymasterUrl),
    })

    const {
        maxFeePerGas,
        maxPriorityFeePerGas
    } = await estimateFeesPerGas(publicClient);

    const kernelClient = createKernelAccountClient({
        account,
        chain,
        bundlerTransport: http(bundlerUrl),
        client: publicClient,
        paymaster: {
            async getPaymasterData(userOperation) {
                let sponsorResult: SponsorUserOperationReturnType | undefined;
                try {
                    sponsorResult = await paymaster.sponsorUserOperation({
                        userOperation, // use public gas policies if available (ex: sponsored by AAVE, PoolTogether, Unizen ..) 
                    });
                } catch (e) {
                    sponsorResult = await paymaster.sponsorUserOperation({
                        userOperation,
                        sponsorshipPolicyId // fallback to a private one
                    });
                }
                return sponsorResult;
            }
        },
        userOperation: {
            estimateFeesPerGas: async () => {
                return {
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                }
            }
        }
    })

    const accountAddress = kernelClient.account.address
    console.log("My account:", accountAddress)

    const userOpHash = await kernelClient.sendUserOperation({
        callData: await kernelClient.account.encodeCalls([{
            to: zeroAddress,
            value: BigInt(0),
            data: "0x",
        }]),
    })

    console.log("UserOp hash:", userOpHash)
    console.log("Waiting for UserOp to complete...")

    await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
        timeout: 1000 * 15,
    })

    console.log("UserOp completed: https://arbitrum-sepolia.blockscout.com/op/" + userOpHash)

    process.exit()
}

main()