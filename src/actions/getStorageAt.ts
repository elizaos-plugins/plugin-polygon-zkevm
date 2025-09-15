import {
  type Action,
  type ActionResult,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import { JsonRpcProvider } from "ethers";
import { getStorageAtTemplate } from "../templates";
import { callLLMWithTimeout } from "../utils/llmHelpers";

/**
 * Get storage at action for Polygon zkEVM
 * Retrieves storage value at a specific slot for a contract address
 */
export const getStorageAtAction: Action = {
  name: "POLYGON_ZKEVM_GET_STORAGE",
  similes: [
    "GET_STORAGE",
    "STORAGE_SLOT",
    "CONTRACT_STORAGE",
    "STORAGE_VALUE",
  ].map((s) => `POLYGON_ZKEVM_${s}`),
  description:
    "Gets the storage at a specific slot for a contract on Polygon zkEVM.",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    const alchemyApiKey = runtime.getSetting("ALCHEMY_API_KEY");
    const zkevmRpcUrl = runtime.getSetting("ZKEVM_RPC_URL");

    if (!alchemyApiKey && !zkevmRpcUrl) {
      return false;
    }

    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    logger.info("[getStorageAtAction] Handler called!");

    const alchemyApiKey = runtime.getSetting("ALCHEMY_API_KEY");
    const zkevmRpcUrl = runtime.getSetting("ZKEVM_RPC_URL");

    if (!alchemyApiKey && !zkevmRpcUrl) {
      const errorMessage =
        "ALCHEMY_API_KEY or ZKEVM_RPC_URL is required in configuration.";
      logger.error(`[getStorageAtAction] Configuration error: ${errorMessage}`);
      if (callback) {
        await callback({
          text: errorMessage,
          content: { success: false, error: errorMessage },
        });
      }
      return {
        success: false,
        text: `❌ ${errorMessage}`,
        values: { storageRetrieved: false, error: true, errorMessage },
        data: { actionName: "POLYGON_ZKEVM_GET_STORAGE", error: errorMessage },
        error: new Error(errorMessage),
      };
    }

    let storageInput: any | null = null;

    // Extract storage parameters using LLM with OBJECT_LARGE model
    try {
      storageInput = await callLLMWithTimeout<{
        address: string;
        position: string | number;
        blockTag?: string | number;
        error?: string;
      }>(runtime, state, getStorageAtTemplate, "getStorageAtAction");

      if (storageInput?.error) {
        logger.error(
          "[getStorageAtAction] LLM returned an error:",
          storageInput?.error,
        );
        throw new Error(storageInput?.error);
      }

      if (!storageInput?.address || !storageInput?.position) {
        throw new Error("Invalid storage parameters received from LLM.");
      }
    } catch (error) {
      logger.debug(
        "[getStorageAtAction] OBJECT_LARGE model failed",
        error instanceof Error ? error.message : String(error),
      );
      const errorMessage = `[getStorageAtAction] Failed to extract storage parameters from input: ${error instanceof Error ? error.message : String(error)}`;
      if (callback) {
        await callback({
          text: errorMessage,
          content: { success: false, error: errorMessage },
        });
      }
      return {
        success: false,
        text: `❌ ${errorMessage}`,
        values: { storageRetrieved: false, error: true, errorMessage },
        data: { actionName: "POLYGON_ZKEVM_GET_STORAGE", error: errorMessage },
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }

    const address = storageInput.address;
    const position = storageInput.position;
    const blockTag = storageInput.blockTag || "latest";

    // Setup provider - prefer Alchemy, fallback to RPC
    let provider: JsonRpcProvider;
    let methodUsed: "alchemy" | "rpc" = "rpc";
    const zkevmAlchemyUrl =
      runtime.getSetting("ZKEVM_ALCHEMY_URL") ||
      "https://polygonzkevm-mainnet.g.alchemy.com/v2";

    if (alchemyApiKey) {
      provider = new JsonRpcProvider(`${zkevmAlchemyUrl}/${alchemyApiKey}`);
      methodUsed = "alchemy";
    } else {
      provider = new JsonRpcProvider(zkevmRpcUrl);
    }

    // Get storage at the specified slot
    const storageValue = await provider.getStorage(address, position, blockTag);

    let responseText = `🗄️ **Storage Value (Polygon zkEVM)**

**Contract:** \`${address}\`
**Position:** ${position}
**Block:** ${blockTag}
**Value:** \`${storageValue}\`
**Method:** ${methodUsed}

`;

    // Try to interpret the value
    if (
      storageValue ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      responseText += `💡 **Interpretation:** Empty/Zero value`;
    } else {
      // Try to interpret as different types
      const bigIntValue = BigInt(storageValue);
      if (bigIntValue > 0n && bigIntValue < 2n ** 160n) {
        // Could be an address
        const possibleAddress = "0x" + storageValue.slice(-40);
        if (possibleAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
          responseText += `🏠 **Possible Address:** \`${possibleAddress}\`\n`;
        }
      }

      // Show as decimal if reasonable size
      if (bigIntValue < 2n ** 64n) {
        responseText += `🔢 **As Decimal:** ${bigIntValue.toString()}\n`;
      }

      // Show as string if it looks like text
      try {
        const hexString = storageValue.slice(2);
        const bytes = [];
        for (let i = 0; i < hexString.length; i += 2) {
          bytes.push(parseInt(hexString.substr(i, 2), 16));
        }
        const text = String.fromCharCode(
          ...bytes.filter((b) => b > 31 && b < 127),
        );
        if (text.length > 0 && text.trim().length > 0) {
          responseText += `📝 **As Text:** "${text.trim()}"`;
        }
      } catch (e) {
        // Ignore text conversion errors
      }
    }

    if (callback) {
      await callback({
        text: responseText,
        content: { success: true, storageValue },
      });
    }

    return {
      success: true,
      text: responseText,
      values: { storageRetrieved: true, storageValue },
      data: {
        actionName: "POLYGON_ZKEVM_GET_STORAGE",
        address,
        position,
        blockTag,
        storageValue,
        network: "polygon-zkevm",
        method: methodUsed,
      },
    };
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "Get storage slot 0 for contract 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 on Polygon zkEVM",
        },
      },
      {
        name: "{{user2}}",
        content: {
          text: "I'll get the storage value at that slot for the contract on Polygon zkEVM.",
          action: "POLYGON_GET_STORAGE_AT_ZKEVM",
        },
      },
    ],
  ],
};
