import {
  type Action,
  type ActionResult,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
  type Content,
  logger,
  ModelType,
  composePromptFromState,
} from "@elizaos/core";
import { z } from "zod";
import { JsonRpcProvider } from "ethers";
import { blockDetailsByNumberTemplate } from "../templates";
import { callLLMWithTimeout } from "../utils/llmHelpers";

export const getBlockDetailsByNumberAction: Action = {
  name: "POLYGON_ZKEVM_GET_BLOCK_DETAILS_BY_NUMBER",
  similes: ["GET_BLOCK_BY_NUMBER", "SHOW_BLOCK_DETAILS_BY_NUMBER"].map(
    (s) => `POLYGON_ZKEVM_${s}`,
  ),
  description: "Gets block details for a given number on Polygon zkEVM.",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    const alchemyApiKey = runtime.getSetting("ALCHEMY_API_KEY"); // Assuming direct env access for now
    const zkevmRpcUrl = runtime.getSetting("ZKEVM_RPC_URL"); // Assuming direct env access for now

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
    logger.info("[getBlockDetailsByNumberAction] Handler called!");

    const alchemyApiKey = runtime.getSetting("ALCHEMY_API_KEY"); // Assuming direct env access for now
    const zkevmRpcUrl = runtime.getSetting("ZKEVM_RPC_URL"); // Assuming direct env access for now

    if (!alchemyApiKey && !zkevmRpcUrl) {
      const errorMessage =
        "ALCHEMY_API_KEY or ZKEVM_RPC_URL is required in configuration.";
      logger.error(
        `[getBlockDetailsByNumberAction] Configuration error: ${errorMessage}`,
      );
      if (callback) {
        await callback({
          text: errorMessage,
          content: { success: false, error: errorMessage },
        });
      }
      return {
        success: false,
        text: `❌ ${errorMessage}`,
        values: { blockRetrieved: false, error: true, errorMessage },
        data: {
          actionName: "POLYGON_ZKEVM_GET_BLOCK_DETAILS_BY_NUMBER",
          error: errorMessage,
        },
        error: new Error(errorMessage),
      };
    }

    let blockDetails: any | null = null;
    let methodUsed: "alchemy" | "rpc" | null = null;
    let errorMessages: string[] = [];
    let blockNumberInput: any | null = null;

    // First try using OBJECT_LARGE model type for structured output
    try {
      // The plugin-evm approach is to directly use ModelType.OBJECT_LARGE
      // and handle any potential errors in the catch block
      blockNumberInput = await callLLMWithTimeout<{ blockNumber: number }>(
        runtime,
        state,
        blockDetailsByNumberTemplate,
        "getBlockDetailsByNumberAction",
      );

      // Check if the model returned an error field
      if (blockNumberInput?.error) {
        logger.error(
          "[getBlockDetailsByNumberAction] LLM returned an error:",
          blockNumberInput?.error,
        );
        throw new Error(blockNumberInput?.error);
      }
    } catch (error) {
      // If OBJECT_LARGE fails, fall back to TEXT_LARGE and manual parsing
      logger.debug(
        "[getBlockDetailsByNumberAction] OBJECT_LARGE model failed",
        error instanceof Error ? error.message : String(error),
      );
      const errorMessage =
        "[getBlockDetailsByNumberAction] OBJECT_LARGE model failed";
      if (callback) {
        await callback({
          text: errorMessage,
          content: { success: false, error: errorMessage },
        });
      }
      return {
        success: false,
        text: `❌ ${errorMessage}`,
        values: { blockRetrieved: false, error: true, errorMessage },
        data: {
          actionName: "POLYGON_ZKEVM_GET_BLOCK_DETAILS_BY_NUMBER",
          error: errorMessage,
        },
        error: new Error(errorMessage),
      };
    }

    // Extract the actual block number from the LLM response
    const blockNumber = blockNumberInput?.blockNumber;
    if (!blockNumber || typeof blockNumber !== "number") {
      const errorMessage = "Invalid block number extracted from input";
      if (callback) {
        await callback({
          text: errorMessage,
          content: { success: false, error: errorMessage },
        });
      }
      return {
        success: false,
        text: `❌ ${errorMessage}`,
        values: { blockRetrieved: false, error: true, errorMessage },
        data: {
          actionName: "POLYGON_ZKEVM_GET_BLOCK_DETAILS_BY_NUMBER",
          error: errorMessage,
        },
        error: new Error(errorMessage),
      };
    }

    // Convert block number to hex format for API calls
    const blockNumberHex = "0x" + blockNumber.toString(16);

    logger.info(
      `[getBlockDetailsByNumberAction] Processing block number: ${blockNumber} (hex: ${blockNumberHex})`,
    );

    // 1. Attempt to use Alchemy API (using standard eth_getBlockByNumber method as per example)
    if (alchemyApiKey) {
      try {
        logger.info(
          `[getBlockDetailsByNumberAction] Attempting to use Alchemy API for block ${blockNumber}`,
        );
        // Assuming the RPC URL pattern and API key usage is consistent
        const zkevmAlchemyUrl =
          runtime.getSetting("ZKEVM_ALCHEMY_URL") ||
          "https://polygonzkevm-mainnet.g.alchemy.com/v2";
        const alchemyUrl = `${zkevmAlchemyUrl}/${alchemyApiKey}`;
        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBlockByNumber",
            params: [blockNumberHex, true], // Use hex format for API
            id: 1,
          }),
        };

        const response = await fetch(alchemyUrl, options);
        if (!response.ok) {
          throw new Error(
            `Alchemy API returned status ${response.status}: ${response.statusText}`,
          );
        }
        const data = (await response.json()) as {
          error?: { message: string };
          result?: any;
        };

        if (data?.error) {
          throw new Error(
            `Alchemy API returned error: ${data?.error?.message}`,
          );
        }

        if (data?.result) {
          blockDetails = data?.result;
          methodUsed = "alchemy";
          logger.info(
            `[getBlockDetailsByNumberAction] Block details from Alchemy for block ${blockNumber}`,
          );
        } else {
          // Alchemy returned no error but also no result for a valid number might mean block not found via Alchemy
          logger.warn(
            `[getBlockDetailsByNumberAction] Alchemy API returned no result for block ${blockNumber}.`,
          );
        }
      } catch (error) {
        logger.error(
          `Error using Alchemy API for block ${blockNumber}:`,
          error,
        );
        errorMessages.push(
          `Alchemy API failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue to fallback
      }
    }

    // 2. Fallback to JSON-RPC if Alchemy failed or not configured
    if (blockDetails === null && zkevmRpcUrl) {
      logger.info(
        `[getBlockDetailsByNumberAction] Falling back to JSON-RPC for block ${blockNumber}`,
      );
      try {
        const provider = new JsonRpcProvider(zkevmRpcUrl);
        // Ethers.js getBlock by number accepts hex or decimal strings, and a boolean for full details
        const block = await provider.getBlock(blockNumber, true);

        if (block) {
          // Convert to JSON if available; otherwise use object directly
          const maybeJson = (block as unknown as { toJSON?: () => unknown })
            .toJSON;
          blockDetails =
            typeof maybeJson === "function" ? maybeJson.call(block) : block;
          methodUsed = "rpc";
          logger.info(
            `[getBlockDetailsByNumberAction] Block details from RPC for block ${blockNumber}`,
          );
        } else {
          logger.warn(
            `[getBlockDetailsByNumberAction] RPC returned no block for number ${blockNumber}.`,
          );
        }
      } catch (error) {
        logger.error(
          `Error using JSON-RPC fallback for block ${blockNumber}:`,
          error,
        );
        errorMessages.push(
          `JSON-RPC fallback failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Handle result and errors
    if (blockDetails !== null) {
      // Attempt to extract zkEVM specific fields if they exist
      const zkevmFields = {
        zkProverVersion: blockDetails.zkProverVersion, // Assuming these fields exist on the returned object
        batchIndex: blockDetails.batchIndex,
        // Add other zkEVM specific fields as needed based on RPC response structure
      };

      const successText = `Here are the details for Polygon zkEVM block ${blockNumber} (via ${methodUsed}):\n\n\`\`\`json\n${JSON.stringify(blockDetails, null, 2)}\n\`\`\`\nZK-specific fields: ${JSON.stringify(zkevmFields, null, 2)}`;

      if (callback) {
        await callback({
          text: successText,
          content: { success: true, blockNumber },
        });
      }

      return {
        success: true,
        text: successText,
        values: { blockRetrieved: true, blockNumber },
        data: {
          actionName: "POLYGON_ZKEVM_GET_BLOCK_DETAILS_BY_NUMBER",
          block: blockDetails,
          zkevmFields: zkevmFields,
          network: "polygon-zkevm",
          timestamp: Date.now(),
          method: methodUsed,
        },
      };
    } else {
      // Both methods failed or block not found
      const errorMessage = `Failed to retrieve details for Polygon zkEVM block ${blockNumber} using both Alchemy and RPC. Errors: ${errorMessages.join("; ")}. It's possible the block number is invalid or the block does not exist yet.`;
      logger.error(errorMessage);

      if (callback) {
        await callback({
          text: `❌ ${errorMessage}`,
          content: { success: false, error: errorMessage },
        });
      }

      return {
        success: false,
        text: `❌ ${errorMessage}`,
        values: { blockRetrieved: false, error: true, errorMessage },
        data: {
          actionName: "POLYGON_ZKEVM_GET_BLOCK_DETAILS_BY_NUMBER",
          error: errorMessage,
          errors: errorMessages,
          blockNumber,
        },
        error: new Error(errorMessage),
      };
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "get polygon zkevm block details for block 12345",
        },
      },
      {
        name: "{{user2}}",
        content: {
          text: 'Here are the details for Polygon zkEVM block 12345 (via alchemy):\n```json\n{\n  "number": 12345,\n  "hash": "0x...",\n  "parentHash": "0x...",\n  "timestamp": 1234567890,\n  "transactions": []\n}\n```\nZK-specific fields: {\n  "zkProverVersion": "1.0.0",\n  "batchIndex": 123\n}',
          action: "POLYGON_GET_BLOCK_DETAILS_BY_NUMBER_ZKEVM",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "show zkevm block details by number 54321",
        },
      },
      {
        name: "{{user2}}",
        content: {
          text: 'Here are the details for Polygon zkEVM block 54321 (via rpc):\n```json\n{\n  "number": 54321,\n  "hash": "0x...",\n  "parentHash": "0x...",\n  "timestamp": 1234567999,\n  "transactions": []\n}\n```\nZK-specific fields: {\n  "zkProverVersion": "1.0.1",\n  "batchIndex": 456\n}',
          action: "POLYGON_GET_BLOCK_DETAILS_BY_NUMBER_ZKEVM",
        },
      },
    ],
  ],
};
