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

Unless you have a high-end GPU, I recommend downloading the smallest model available. You can always upgrade later.

Run the following command to pull the model:
```bash
ollama pull deepseek-r1:1.5b
```

### docker
Docker is a platform that allows you to run applications in containers. We’ll use Docker to run n8n.
- [MacOS](https://docs.docker.com/desktop/setup/install/mac-install/)
- [Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Linux](https://docs.docker.com/engine/install/)

**Note:** If you're using windows, you may need to use WSL2 to run Docker. You can find instructions [here](https://docs.docker.com/desktop/windows/wsl/).

### n8n
n8n is a workflow automation tool that allows you to connect various services and APIs. You can use it to automate tasks and workflows.

in this post, we’ll use n8n to connect to Ollama and interact with the Deepseek model.

I recommend installing n8n using Docker. Run the following command to start n8n:
```bash
docker volume create n8n_data

docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

Once n8n is running, open http://localhost:5678 in your browser. You may need to create an account to access the n8n interface.

## Setting Up n8n
### Credentials
before we can start using n8n, we need to set up the ollama node. The ollama node allows you to interact with the Deepseek model. before we can create a connection, we need to configure the ollama credentials.

![n8n Credentials](/images/credential.png)

Search for ollama in the search bar.

![n8n Credentials Search](/images/search_credential.png)

If you follow this guide, the base url should be `http://localhost:11434`. Save the credentials.

![n8n ollama credential](/images/ollama_credential.png)

### Workflow
Now that we have the credentials set up, we can create a workflow. In this example, we'll create a simple AI Agent that will generate a chinese learning story.

from your n8n dashboard, click on the `Create workflow` button to create a new workflow.

I've created a simple workflow that generates a chinese learning story. You can copy this workflow by [downloading the json here](json/Chinese_Story_Learning_AI_Agent.json).

![n8n import wofklow](/images/import_workflow.png)

After downloading the json, click on the `Import from file` button and select the json file.

![n8n Workflow](/images/update_ollama_model.png)

You will need to update the Ollama model node with the model you downloaded earlier.

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

Because we use the Deepseek model a thinking model, the response from the model will contain the thinking process that is wrapped between `<think>` and `</think>` tags. After we got the response, we will remove the thinking process and return the story.

This is the result of the workflow:

```
\n\n## 汉字\n\n一天，一个小女孩穿着红色的围巾走在街上。她看到一位老人在公园门口摔倒了。小女孩立刻跑过去，扶起了老人。\n\n老人感谢她，说：“你真是个好孩子。”\n\n小女孩笑了笑，说：“您没事吧？我送您回家吧。”\n\n老人同意了，于是小女孩搀扶着老人慢慢走回了他的家。老人非常感激，并给了女孩一些糖果作为感谢。\n\n第二天，小女孩又遇到了那位老人，这次她还带了自己的朋友一起去帮助老人。他们一起照顾老人，直到他完全康复。\n\n## Pin yin Version\n\nYī tiān, yī gè xiǎogirl tāng zhe hóng sī huǒ de wéijin zǒu zài jiēdào shàng. Tā kàn dàole yī gè lǎo rén zài gōngyuán kǒu mén diū dàng le. Xiǎogirl kènlì pǎo qù, fú qǐ le lǎo ren.\n\nLǎo ren xie xie jiù shuō: "Nǐ zhēn shi gè hǎo háizi."\n\nXiǎogirl xiào le, shuō: "Nín wúshì ba? Wǒ sòng nín huíjiā ba."\n\nLǎo ren dāng rán le, yīn cǐ xiǎogirl qiān fàn zhe lǎo ren man man zǒu hui le tā de jiā. Lǎo ren fēicháng gǎn gài, hé bǎ xiǎogirl yī xiē tóng guǒ zuò wéi xie cì.\n\nDì er tiān, xiǎogirl yòu jiànyù le yī ge lǎo ren, zhè cì tā hái dài le zì jǐ de pengyou qítāo qù bāngzhù lǎo ren. Tāmen yī qǐ sháo jì lǎo ren, zhí dào tā wán quān hóng kuài.\n\n## English Translation\n\nOne day, a little girl wearing a red scarf was walking down the street. She saw an old man fall at the park entrance. The little girl ran over and helped him up.\n\nThe old man thanked her, saying, "You are such a good child."\n\nThe little girl smiled and asked, "Are you okay? Let me take you home."  \n\nThe old man agreed, and the little girl escorted him home with support. He was very grateful and gave her some candies as a token of appreciation.\n\nThe next day, the little girl met the old man again, this time bringing her friend to help him as well. They took care of him together until he fully recovered.
```

## Conclusion

And that's it! You've successfully set up a local AI agent using Deepseek and n8n. You can improve this agent like sending this result as email to you, send a telegram post, or even create a website that will display the story. The possibilities are endless!

This is actually my personal AI Agent, and I use it to generate stories for my Chinese practice. I hope you find it useful too! You can see the result of my workflow [here](https://blog.wendyliga.com/chinese/).