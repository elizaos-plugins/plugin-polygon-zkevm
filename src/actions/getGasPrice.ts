import {
  type Action,
  type ActionResult,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type State,
  composePromptFromState,
  logger
} from '@elizaos/core';
import { JsonRpcProvider } from 'ethers';
import { getGasPriceTemplate } from '../templates';

/**
 * Get gas price action for Polygon zkEVM
 * Retrieves current gas price
 */
export const getGasPriceAction: Action = {
  name: 'POLYGON_ZKEVM_GET_GAS_PRICE',
  similes: ['GAS_PRICE', 'CURRENT_GAS', 'GAS_FEE', 'GWEI'].map((s) => `POLYGON_ZKEVM_${s}`),
  description: 'Get current gas price on Polygon zkEVM',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    const alchemyApiKey = runtime.getSetting('ALCHEMY_API_KEY');
    const zkevmRpcUrl = runtime.getSetting('ZKEVM_RPC_URL');

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
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    logger.info('[getGasPriceAction] Handler called!');

    const alchemyApiKey = runtime.getSetting('ALCHEMY_API_KEY');
    const zkevmRpcUrl = runtime.getSetting('ZKEVM_RPC_URL');

    if (!alchemyApiKey && !zkevmRpcUrl) {
      const errorMessage = 'ALCHEMY_API_KEY or ZKEVM_RPC_URL is required in configuration.';
      logger.error(`[getGasPriceAction] Configuration error: ${errorMessage}`);
      
      if (callback) {
        callback({
          text: errorMessage,
          content: { error: errorMessage, success: false },
        });
      }
      
      return {
        success: false,
        text: `❌ ${errorMessage}`,
        values: {
          gasPriceRetrieved: false,
          error: true,
          errorMessage,
        },
        data: {
          actionName: 'POLYGON_ZKEVM_GET_GAS_PRICE',
          error: errorMessage,
        },
        error: new Error(errorMessage),
      };
    }

    // Use LLM to validate this is a gas price request
    try {
      const gasRequestInput = (await runtime.useModel(ModelType.OBJECT_LARGE, {
        prompt: composePromptFromState({
          state,
          template: getGasPriceTemplate,
        }),
      })) as { requestGasPrice?: boolean; error?: string };

      if (gasRequestInput?.error) {
        throw new Error(gasRequestInput.error);
      }
    } catch (error) {
      logger.debug('[getGasPriceAction] LLM validation failed, proceeding anyway');
    }

    // Setup provider - prefer Alchemy, fallback to RPC
    let provider: JsonRpcProvider;
    let methodUsed: 'alchemy' | 'rpc' = 'rpc';
    const zkevmAlchemyUrl =
      runtime.getSetting('ZKEVM_ALCHEMY_URL') || 'https://polygonzkevm-mainnet.g.alchemy.com/v2';

    if (alchemyApiKey) {
      provider = new JsonRpcProvider(`${zkevmAlchemyUrl}/${alchemyApiKey}`);
      methodUsed = 'alchemy';
    } else {
      provider = new JsonRpcProvider(zkevmRpcUrl);
    }

    try {
      // Get gas price
      const gasPrice = await provider.send('eth_gasPrice', []);
      const gasPriceInWei = BigInt(gasPrice);
      const gasPriceInGwei = Number(gasPriceInWei) / 1e9;

      // Get fee data for more comprehensive information
      let feeData;
      try {
        feeData = await provider.getFeeData();
      } catch (error) {
        logger.warn('Could not get fee data, using basic gas price only');
      }

      let responseText = `⛽ **Current Gas Price (Polygon zkEVM)**

💸 **Gas Price:** ${gasPriceInGwei.toFixed(4)} Gwei (${gasPriceInWei.toString()} wei)
🔗 **Method:** ${methodUsed}`;

      if (feeData) {
        if (feeData.maxFeePerGas) {
          const maxFeeGwei = Number(feeData.maxFeePerGas) / 1e9;
          responseText += `\n🔝 **Max Fee Per Gas:** ${maxFeeGwei.toFixed(4)} Gwei`;
        }
        if (feeData.maxPriorityFeePerGas) {
          const maxPriorityFeeGwei = Number(feeData.maxPriorityFeePerGas) / 1e9;
          responseText += `\n⚡ **Max Priority Fee:** ${maxPriorityFeeGwei.toFixed(4)} Gwei`;
        }
      }

      // Add cost estimates for common operations
      const transferCost = (gasPriceInGwei * 21000) / 1e9; // ETH cost for simple transfer
      const swapCost = (gasPriceInGwei * 150000) / 1e9; // Approximate cost for DEX swap

      responseText += `\n\n💰 **Estimated Transaction Costs:**
📤 Simple Transfer: ~${transferCost.toFixed(6)} ETH
🔄 Token Swap: ~${swapCost.toFixed(6)} ETH`;

    if (callback) {
      callback({
        text: responseText,
        content: {
          success: true,
          gasPrice: gasPriceInWei.toString(),
          gasPriceGwei: gasPriceInGwei,
          network: 'polygon-zkevm',
          method: methodUsed,
        },
      });
    }

    return {
      success: true,
      text: responseText,
      values: {
        gasPriceRetrieved: true,
        gasPriceGwei: gasPriceInGwei,
      },
      data: {
        actionName: 'POLYGON_ZKEVM_GET_GAS_PRICE',
        gasPrice: gasPriceInWei.toString(),
        gasPriceGwei: gasPriceInGwei,
        feeData,
        network: 'polygon-zkevm',
        method: methodUsed,
        transferCostEth: transferCost,
        swapCostEth: swapCost,
      },
    };
    } catch (error) {
      const errorMessage = `Failed to retrieve gas price: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(`[getGasPriceAction] ${errorMessage}`);
      
      if (callback) {
        callback({
          text: errorMessage,
          content: { error: errorMessage, success: false },
        });
      }
      
      return {
        success: false,
        text: `❌ ${errorMessage}`,
        values: {
          gasPriceRetrieved: false,
          error: true,
          errorMessage,
        },
        data: {
          actionName: 'POLYGON_ZKEVM_GET_GAS_PRICE',
          error: errorMessage,
        },
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{user1}}',
        content: {
          text: 'What is the current gas price on Polygon zkEVM?',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: "I'll get the current gas price for Polygon zkEVM.",
          action: 'POLYGON_GET_GAS_PRICE_ZKEVM',
        },
      },
    ],
  ],
};
