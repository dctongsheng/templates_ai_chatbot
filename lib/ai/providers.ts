import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const THINKING_SUFFIX_REGEX = /-thinking$/;

// 从环境变量读取 API Key
const customApiKey = process.env.OPENAI_API_KEY;

// 使用 OpenRouter provider
const openrouterClient = createOpenRouter({
  apiKey: customApiKey,
});

// 测试环境的mock provider
const testProvider = (() => {
  const { artifactModel, chatModel, reasoningModel, titleModel } = require("./models.mock");
  return {
    languageModel: (id: string) => {
      const models: Record<string, any> = {
        "chat-model": chatModel,
        "chat-model-reasoning": reasoningModel,
        "title-model": titleModel,
        "artifact-model": artifactModel,
      };
      return models[id];
    },
  };
})();

export function getLanguageModel(modelId: string) {
  // 测试环境使用mock模型
  if (isTestEnvironment) {
    return testProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  // 解析模型ID - 支持格式 "openai/gpt-4o-mini" 或 "gpt-4o-mini"
  let modelName = modelId.replace("openai/", "");

  if (isReasoningModel) {
    modelName = modelName.replace(THINKING_SUFFIX_REGEX, "");
    return wrapLanguageModel({
      model: openrouterClient.chat(modelName),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return openrouterClient.chat(modelName);
}

export function getTitleModel() {
  if (isTestEnvironment) {
    return testProvider.languageModel("title-model");
  }
  // 使用gpt-4o-mini生成标题
  return openrouterClient.chat("gpt-4o-mini");
}

export function getArtifactModel() {
  if (isTestEnvironment) {
    return testProvider.languageModel("artifact-model");
  }
  return openrouterClient.chat("gpt-4o-mini");
}
