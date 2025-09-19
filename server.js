#!/usr/bin/env node
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const axios = require("axios");
require("dotenv").config();

// 创建 MCP 服务器
const server = new McpServer({
  name: "entity-enum-server",
  version: "1.0.0",
});

// 正确的工具定义 - 无参数的工具
server.tool(
  "get_entities_simple",
  "获取所有实体列简要信息(表名称和英文名)",
  {
    // 即使没有参数，也要提供一个空的 schema 对象
    type: "object",
    properties: {},
  },
  async () => {
    try {
      console.error("调用 get_entities_simple");
      const response = await makeRequest("/entities/simple", "GET");
      return {
        content: [{ type: "text", text: response.text || JSON.stringify(response) }],
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "get_enums_simple",
  "获取所有枚举列简要信息(名称和英文名)",
  {
    type: "object",
    properties: {},
  },
  async () => {
    try {
      console.error("调用 get_enums_simple");
      const response = await makeRequest("/enums/simple", "GET");
      return {
        content: [{ type: "text", text: response.text || JSON.stringify(response) }],
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "get_all_simple",
  "获取所有实体列简要信息 + 所有枚举列简要信息",
  {
    type: "object",
    properties: {},
  },
  async () => {
    try {
      console.error("调用 get_all_simple");
      const response = await makeRequest("/all/simple", "GET");
      return {
        content: [{ type: "text", text: response.text || JSON.stringify(response) }],
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// 有参数的工具 - 正确的定义方式
server.tool(
  "get_ai_simple",
  "获取经过AI推荐的 和输入相关的 实体和枚举类型名称(仅返回中英文名称，如:<用户,User>)",
  {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "输入内容",
      },
    },
    required: ["input"],
  },
  async (params) => {
    try {
      console.error("调用 get_ai_simple，输入:", params.input);
      const response = await makeRequest("/ai/simple", "POST", { question: params.input });
      return {
        content: [{ type: "text", text: response.text || JSON.stringify(response) }],
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "get_ai_detail",
  "获取经过AI推荐的 和输入相关的 所有实体和枚举详细结构(包含详细属性说明，如：<用户,User>:{name:姓名、age:年龄})",
  {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "输入内容",
      },
    },
    required: ["input"],
  },
  async (params) => {
    try {
      console.error("调用 get_ai_detail，输入:", params.input);
      const response = await makeRequest("/ai/detail", "POST", { question: params.input });
      return {
        content: [{ type: "text", text: response.text || JSON.stringify(response) }],
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// 发送请求到远程API
async function makeRequest(path, method, data = null) {
  const endpoint = process.env.ENDPOINT;
  const apiKey = process.env.API_KEY;

  if (!endpoint) {
    throw new Error("ENDPOINT environment variable is not set");
  }

  const config = {
    method,
    url: `${endpoint}${path}`,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }

  if (data && (method === "POST" || method === "PUT")) {
    config.data = data;
  }

  console.error(`请求: ${method} ${config.url}`);
  const response = await axios(config);
  return response.data.data;
}

// 错误处理
function handleError(error) {
  console.error("请求失败:", error.message);

  let errorMessage = error.message;
  if (error.response) {
    errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
    if (error.response.data) {
      errorMessage += ` - ${JSON.stringify(error.response.data)}`;
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `错误: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}

// 启动服务器
async function main() {
  try {
    console.error("启动 MCP 服务器...");
    console.error("端点:", process.env.ENDPOINT || "未设置");
    console.error("API 密钥:", process.env.API_KEY ? "已设置" : "未设置");

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ MCP 服务器启动成功，等待连接...");
  } catch (error) {
    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("服务器错误:", error);
  process.exit(1);
});
