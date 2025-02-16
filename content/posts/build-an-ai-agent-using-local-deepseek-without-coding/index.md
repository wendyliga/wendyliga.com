---
title: Build an AI Agent Using Local Deepseek Without Coding
description: This post walks you through setting up a local AI agent using Ollama to host the LLM and n8n to automate workflows.
summary: This post walks you through setting up a local AI agent using Ollama to host the LLM and n8n to automate workflows.
date: 2025-02-16T15:26:53.302Z
preview: /images/igor-omilaev-eGGFZ5X2LnA-unsplash.jpg
draft: false
tags: []
categories:
    - automation
keywords:
    - ai
    - deepseek
    - llm
    - agent
readTime: true
autonumber: false
toc: true
math: false
---

Unless you’ve been living under a rock, you’ve probably heard of ChatGPT or AI. In early 2025, a new player entered the scene—Deepseek. Not only is Deepseek a powerful model comparable to OpenAI’s, but it’s also open-source. In this post, I’ll show you how to build a local AI agent using Deepseek—no coding required!

![AI](/images/igor-omilaev-eGGFZ5X2LnA-unsplash.jpg)
*Photo by <a href="https://unsplash.com/@omilaev?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Igor Omilaev</a> on <a href="https://unsplash.com/photos/a-computer-chip-with-the-letter-a-on-top-of-it-eGGFZ5X2LnA?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>*

## What You’ll Need
### Ollama
Ollama is a free, open-source platform that allows you to host the Deepseek model. You can install it on your local machine.
Open https://ollama.com/download and download the latest version of Ollama for your operating system.

Once set, you will need to download the Deepseek model. You can find the latest version at https://ollama.com/library/deepseek-r1.

![Ollama Model Selection](/images/ollama_model_selection.png)

If you don’t have a high-end GPU, I recommend downloading the smallest model available. You can always upgrade later.

Run the following command to pull the model:
```bash
ollama pull deepseek-r1:1.5b
```

### docker
Docker is a platform that allows you to run applications in containers. We'll use it to run n8n.
- [MacOS](https://docs.docker.com/desktop/setup/install/mac-install/)
- [Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Linux](https://docs.docker.com/engine/install/)

> Note: If you're using windows, you may need to use WSL2 to run Docker. You can find instructions [here](https://docs.docker.com/desktop/windows/wsl/).

### n8n
n8n is a workflow automation tool that lets you connect various services and APIs to automate tasks.

In this post, we’ll use n8n to connect to Ollama and interact with the Deepseek model.

#### Installing n8n with Docker
```bash
docker volume create n8n_data

docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

Once n8n is running, open http://localhost:5678 in your browser. You may need to create an account to access the n8n interface.

## Setting Up n8n
### Credentials
Before we can start using n8n, we need to set up the Ollama node. This allows us to interact with the Deepseek model.

![n8n Credentials](/images/credential.png)

Search for **Ollama** in the search bar.

![n8n Credentials Search](/images/search_credential.png)

If you follow this guide, the **Base URL** should be `http://localhost:11434`. Save the credentials.

![n8n ollama credential](/images/ollama_credential.png)

### Workflow
Now that our credentials are set up, we can create a workflow. In this example, we’ll build a simple AI agent that generates a **Chinese learning story**.

from your n8n dashboard, click on the `Create workflow` button to create a new workflow.

#### Steps to Create the Workflow

1. Open the n8n dashboard and click on **Create workflow**.
2. I’ve created a pre-made workflow that generates a Chinese learning story.
[👉 Download the JSON file here](json/Chinese_Story_Learning_AI_Agent.json)

![n8n import wofklow](/images/import_workflow.png)
3. In n8n, click on `Import from file` and select the downloaded JSON file.

![n8n Workflow](/images/update_ollama_model.png)
4. After importing, update the **Ollama model node** with the model you downloaded earlier.


![n8n Workflow](/images/example_workflow.png)

This workflow will automatically run everyday at 9PM. After that it will trigger the AI agent to generate a chinese learning story.

This is the prompt i used to generate the story:
```
write me a short story written in Chinese to help me with my Chinese practice. Include hanzi, then a pinyin version, then the English translation

example output: 
## 汉字

## Pin yin Version

## English Translation
```

Since Deepseek is a **thinking model**, its response may include a reasoning process wrapped between `<think>` and `</think>` tags. The workflow automatically removes these tags before returning the final story.

This is the result of the workflow:

```
## 汉字  
一天，一个小女孩穿着红色的围巾走在街上。她看到一位老人在公园门口摔倒了。小女孩立刻跑过去，扶起了老人。  

## Pinyin Version  
Yī tiān, yī gè xiǎo nǚhái chuān zhe hóngsè de wéijīn zǒu zài jiēshàng...  

## English Translation  
One day, a little girl wearing a red scarf was walking down the street. She saw an old man fall at the park entrance. The little girl ran over and helped him up...  
```

## Conclusion

And that’s it! You’ve successfully set up a **local AI agent** using Deepseek and n8n.

Now, you can expand this agent by:
- ✅ Sending the story via **email** 📧
- ✅ Posting it to **Telegram** 💬
- ✅ Creating a **website** to display the stories 🌐

The possibilities are endless!

This is actually my **personal AI agent**, and I use it to generate stories for my **Chinese practice**. I hope you find it useful too!

You can check out my workflow’s output here [👉 blog.wendyliga.com/chineses](https://blog.wendyliga.com/chinese/)