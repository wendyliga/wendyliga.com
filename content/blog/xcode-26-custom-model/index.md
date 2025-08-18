---
date: 2025-08-17T20:26:53.302+07:00
title: Use Custom Models in the New Xcode 26 Intelligence
description: Use Claude Sonnet, Qwen3, OpenAI GPT-5, or other local models in the new Xcode 26 Intelligence "Agent Mode".
summary: Use Claude Sonnet, Qwen3, OpenAI GPT-5, or other local models in the new Xcode 26 Intelligence "Agent Mode".
preview: /images/thumbnail.png
thumbnail: /images/thumbnail.png
cover: 
draft: false
tags: []
categories:
    - Software Development
keywords:
    - ai
    - llm
    - agent
    - xcode
    - xcode26
    - ollama
    - intelligence
showSummary: true
showComments: false
showWordCount: true
showTableOfContents: true
showTaxonomies: true
showReadingTime: true
showPagination: true
showDate: true
showBreadcrumbs: true
showAuthor: true
fmContentType: default
---

**Xcode 26** introduces **Intelligence Mode**, which lets developers use **AI** to assist with coding tasks. It includes a new **Agent Mode** that allows the AI to interact with your codebase and provide **context‑aware** suggestions.

![Xcode 26](/images/xcode_26.png "Xcode 26")

## Intelligence Mode
In **Xcode 26**, Apple introduced **Intelligence Mode** — an **AI‑powered assistant** that provides **context‑aware** code suggestions to help you write code faster and with fewer errors. As of this post, **Intelligence Mode** is available in the **Xcode 26 beta**. It expands on traditional **code completion** (the system in **Xcode 16**) by offering richer, **project‑aware recommendations** rather than only inline completions.

A key part of **Intelligence Mode** is **Agent Mode**, which lets the AI interact directly with your codebase (for example, **creating**, **editing**, or **removing files**) under **developer control**. **Agent Mode** is designed to accelerate common tasks and surface relevant, **project‑specific changes** while preserving **developer oversight** and review.

![ChatGPT Model](/images/default_chatgpt_model.png)

The **default model** in **Intelligence Mode** is **OpenAI ChatGPT**. Apple hasn’t disclosed the exact variant (it may match the model used by Apple Intelligence when Siri hands off a query), and there’s a **vague daily usage limit**. For development, this default can be problematic: ChatGPT‑style models often produce **plausible‑looking but incorrect code**, can miss **project‑specific constraints**, and aren’t guaranteed to be optimized for **reliable refactors** or **build‑safe edits**. **GPT‑5** is launching and promises stronger programming capabilities, but Apple has not said Xcode uses **GPT‑5** (or any specific release), so for **critical** development work you should consider configuring a **known, code‑focused model** you can **verify** and **control** (**local** or **hosted**).

This post shows how to add **custom models** to **Xcode 26 Intelligence** and expand the assistant’s capabilities. You may prefer a specific model — for example **Claude Sonnet 3.7**, the state‑of‑the‑art **Claude Sonnet 4**, or **Claude Opus 4** — and this guide explains how to configure **Xcode** to use them (both **local** and **hosted**) so you can **verify** and **control** model behavior in **Agent Mode**.

## Custom models
### Anthropic
Anthropic’s **Claude** family (**Sonnet**, etc.) is widely regarded as one of the strongest options for **code generation** and **refactoring**. These models tend to produce clearer, more **context‑aware** edits, handle long **context windows** well, and follow instructions conservatively, which reduces brittle or build‑breaking changes. They also perform well at **tool‑calling** patterns, though that is less relevant today because **Xcode 26’s Agent Mode** does not yet expose **tool‑calling** capabilities.

Even though Anthropic’s **Claude** models are among the best in the industry, they are also some of the most **expensive** options. However, the cost reflects the quality — you get what you pay for. These models deliver exceptional performance, especially for complex, **context‑heavy** tasks, making them a worthwhile investment for **critical** development projects where **accuracy** and **reliability** are paramount.

To start using the **Anthropic** model in **Xcode**, follow these steps:

1. **Create an Anthropic account**  
    Visit the [Anthropic Console](https://console.anthropic.com/dashboard) and register for an account if you don’t already have one.

2. **Generate an API key**  
    ![Anthropic API Key](/images/claude_register_api_key.png)
    After logging in, navigate to the **API Keys** section in the dashboard and create a new **API key**. Make sure to copy and securely store the key, as you’ll need it to configure **Xcode**.

3. **Configure Xcode to use the API key**  
    ![Register custom model in Xcode](/images/claude_register_xcode.png)
    Open **Xcode 26**, go to **Preferences > Intelligence Mode**, and select **Add a Model Provider**. Choose **Internet Hosted**. Enter your **Anthropic API key** in the provided field.

    |Description|Value|
    |---|---|
    |URL|https://api.anthropic.com/v1/messages|
    |API Key|Your Anthropic API key|
    |API Key Header|x-api-key|
    |Description|Anthropic|

4. **Select the Desired Model**  
    ![Claude Model List](/images/claude_xcode_registration.png)
    If **successful**, you should see a list of available models.

5. **Test the model**  
    ![Claude select Model](/images/claude_model_selection.png)
    ![Claude Test](/images/claude_agent.png)

    Once configured, you can select the **Anthropic** model in **Xcode 26** and start using it in **Agent Mode**. Open the **Coding Assistant** panel or press <kbd>⌘</kbd>+<kbd>0</kbd> to begin.

### OpenAI
OpenAI’s **GPT‑5** is another strong option for **code generation** and **refactoring**. It promises improved programming capabilities, but it’s not yet confirmed. If you want to use **OpenAI’s GPT‑5** in **Xcode**, you can follow similar steps as with Anthropic:

1. **Create an OpenAI Platform account**  
    Visit the [OpenAI Console](https://platform.openai.com/) and register for an account if you don’t already have one.

2. **Generate an API key**  
    ![API Key](/images/openai_register_api_key.png)
    After logging in, navigate to the **API Keys** section in the dashboard and create a new **API key**. Make sure to copy and securely store the key, as you’ll need it to configure **Xcode**.

3. **Configure Xcode to use the API key**  
    ![Register custom model in Xcode](/images/openai_xcode_registration.png)
    Open **Xcode 26**, go to **Preferences > Intelligence Mode**, and select **Add a Model Provider**. Choose **Internet Hosted**. Enter your **OpenAI API key** in the provided field.

    |Description|Value|
    |---|---|
    |URL|https://api.openai.com|
    |API Key|Your API key|
    |API Key Header|x-api-key|
    |Description|OpenAI|

4. **Select the Desired Model**  
    ![Model List](/images/openai_model_list.png)
    If **successful**, you should see a list of available models.

    > *NOTE: I needed to manually add the **allowed model** in my OpenAI account; otherwise it did not show up in the list.*
    > This is accessible in **Limits → Allowed Models → Edit**.
    > ![Add Allowed Model](/images/openai_add_allowed_model.png)

5. **Test the model**  
    ![select Model](/images/openai_model_selection.png)
    ![Test](/images/openai_agent.png)

    Once configured, you can select the **OpenAI** model in **Xcode 26** and start using it in **Agent Mode**. Open the **Coding Assistant** panel or press <kbd>⌘</kbd>+<kbd>0</kbd> to begin.

### Local LLMs

If you have a **local LLM** running, such as **[Ollama](https://ollama.com/)** or **[LM Studio](https://lmstudio.ai/)**, you can also use it in **Xcode 26**. Here’s how to set it up:

1. **Configure Xcode**  
    ![Register custom model in Xcode](/images/ollama_xcode_registration.png)
    Open **Xcode 26**, go to **Preferences > Intelligence Mode**, and select **Add a Model Provider**. Choose **Locally Hosted**. Enter the **port** and **description**.

    #### Ollama 
    |Description|Value|
    |---|---|
    |Port|11434|
    |Description|Ollama|

    #### LM Studio 
    |Description|Value|
    |---|---|
    |Port|1234|
    |Description|LM Studio|

    > Start your **LM Studio REST API server** first.
    > ![LM Studio REST API](/images/lm_studio_start_server.png)

2. **Select the Desired Model**  
    ![Model List](/images/local_llm_model_selection.png)
    If **successful**, you should see a list of available models.
3. **Test the model** 
    ![Test](/images/local_llm_agent.png)
    Once configured, you can select the **local model** in **Xcode 26** and start using it in **Agent Mode**. Open the **Coding Assistant** panel or press <kbd>⌘</kbd>+<kbd>0</kbd> to begin.

### Middleware Aggregator

Another option is to use an **AI middleware aggregator**, which allows you to configure a single **API key** and access multiple models (such as **Claude**, **OpenAI GPT**, and others) seamlessly. 

![OpenRouter Model List](/images/openrouter_model_lists.png)
One popular choice is **OpenRouter.io**, which supports models from various AI providers. These include **Anthropic** for its **Claude** models, **OpenAI** for its **GPT** models, **Google** with **Gemini**, **DeepSeek**, **Qwen3**, **Kimi K2**, **Meta** for its **LLaMA** models, and even **GPT-OSS**. OpenRouter provides detailed documentation on integrating with **Xcode 26**, which you can find [here](https://openrouter.ai/docs/community/xcode). For a complete list of supported models, visit [OpenRouter Models](https://openrouter.ai/models?fmt=table&order=top-weekly).

I personally use **OpenRouter** to manage my **AI models**. It provides a unified interface for accessing various AI capabilities and makes switching between different models seamless. This flexibility is especially valuable when working on diverse projects that require specific AI models for optimal performance. Additionally, the pricing is highly competitive compared to using APIs directly from individual AI providers.

## Future Improvements

The new **Xcode 26 Intelligence** feature is an exciting addition to the **Xcode** ecosystem. I’m genuinely eager to incorporate it into my daily development workflow. However, it still falls short when compared to other **AI‑powered code editors** like **[Cursor](https://cursor.com/)**, **[VS Code with Copilot](https://code.visualstudio.com/docs/copilot/overview)**, or even Chinese code editors like **[Trae](https://trae.ai/)**. In practice, I often find myself relying on these other editors more frequently than **Xcode 26**, even though **Xcode** is considered the best IDE for iOS development.

Adding features such as **tool‑calling** capabilities, **customizable system prompts**, support for the **Model Context Protocol (MCP)**, and other enhancements would significantly improve **Xcode 26**. These additions would make it more competitive with other **AI‑powered code editors** and elevate its utility for developers.


## Conclusion

The new **Xcode 26 Intelligence** feature, particularly **Agent Mode**, is a powerful tool for developers. By configuring **custom models** like **Anthropic’s Claude** or **OpenAI’s GPT‑5**, you can enhance the AI’s capabilities and ensure it aligns with your project needs. Whether you choose a **hosted** solution or a **local LLM**, the flexibility to customize the AI assistant in **Xcode 26** opens up new possibilities for efficient and effective coding.
As **Xcode 26** continues to evolve, I look forward to seeing how Apple enhances **Intelligence Mode** and **Agent Mode**, making them even more powerful and user‑friendly. For now, the ability to integrate **custom models** is a significant step forward, allowing developers to tailor the AI assistant to their specific requirements and preferences.
