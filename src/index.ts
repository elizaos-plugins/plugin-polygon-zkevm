import type { Plugin } from '@elizaos/core';
import { type IAgentRuntime, logger } from '@elizaos/core';
import { z } from 'zod';
import { getCurrentBlockNumberAction } from './actions/getCurrentBlockNumber';
import { getBalanceAction } from './actions/getBalance';
import { getTransactionByHashAction } from './actions/getTransactionByHash';
import { getTransactionReceiptAction } from './actions/getTransactionReceipt';
import { getGasPriceAction } from './actions/getGasPrice';
import { getTransactionCountAction } from './actions/getTransactionCount';
import { getCodeAction } from './actions/getCode';
import { getStorageAtAction } from './actions/getStorageAt';
import { getLogsAction } from './actions/getLogs';
import { estimateGasAction } from './actions/estimateGas';
import { getTransactionDetailsAction } from './actions/getTransactionDetails';
import { getAccountBalanceAction } from './actions/getAccountBalance';
import { getGasPriceEstimatesAction } from './actions/getGasPriceEstimates';
import { checkBlockStatusAction } from './actions/checkBlockStatus';
import { getBatchInfoAction } from './actions/getBatchInfo';
import { deploySmartContractAction } from './actions/deploySmartContract';
import { interactSmartContractAction } from './actions/interactSmartContract';
import { bridgeAssetsAction } from './actions/bridgeAssets';
import { bridgeMessagesAction } from './actions/bridgeMessages';
import { estimateTransactionFeeAction } from './actions/estimateTransactionFee';
import { getBlockDetailsByNumberAction } from './actions/getBlockDetailsByNumber';
import { getBlockDetailsByHashAction } from './actions/getBlockDetailsByHash';

const configSchema = z
  .object({
    ALCHEMY_API_KEY: z.string().min(1, 'ALCHEMY_API_KEY is required').optional(),
    ZKEVM_RPC_URL: z.string().url('Invalid ZKEVM_RPC_URL').optional(),
    PRIVATE_KEY: z.string().min(1, 'PRIVATE_KEY is required').optional(),
  })
  .refine((data) => data.ALCHEMY_API_KEY || data.ZKEVM_RPC_URL, {
    message: 'Either ALCHEMY_API_KEY or ZKEVM_RPC_URL must be provided',
  });

const plugin: Plugin = {
  name: 'polygon-zkevm',
  description: 'Plugin for interacting with Polygon zkEVM',
  async init(_config: Record<string, string>, runtime: IAgentRuntime) {
    logger.info('Initializing Polygon zkEVM plugin');
    try {
      const configToValidate = {
        ALCHEMY_API_KEY: runtime.getSetting('ALCHEMY_API_KEY') || process.env.ALCHEMY_API_KEY,
        ZKEVM_RPC_URL: runtime.getSetting('ZKEVM_RPC_URL') || process.env.ZKEVM_RPC_URL,
        PRIVATE_KEY: runtime.getSetting('PRIVATE_KEY') || process.env.PRIVATE_KEY,
      };

      await configSchema.parseAsync(configToValidate);
      logger.info('Polygon zkEVM plugin configuration validated successfully.');
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid Polygon zkEVM plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
  actions: [
    getCurrentBlockNumberAction,
    getBalanceAction,
    getTransactionByHashAction,
    getTransactionReceiptAction,
    getGasPriceAction,
    getTransactionCountAction,
    getCodeAction,
    getStorageAtAction,
    getLogsAction,
    estimateGasAction,
    estimateTransactionFeeAction,
    getTransactionDetailsAction,
    getAccountBalanceAction,
    getGasPriceEstimatesAction,
    checkBlockStatusAction,
    getBatchInfoAction,
    deploySmartContractAction,
    interactSmartContractAction,
    bridgeAssetsAction,
    bridgeMessagesAction,
    getBlockDetailsByNumberAction,
    getBlockDetailsByHashAction,
  ],
};

export default plugin;
