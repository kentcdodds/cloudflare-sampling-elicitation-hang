# Elicit Feedback and Sampling Hang

CloudFlare's agents MCP utility does not currently support elicitation and sampling. As this example demonstrates, go ahead and try to run this with the inspector and you'll notice that for sampling and elicitation, the requests hang indefinitely. 

```
git clone https://github.com/kentcdodds/cloudflare-sampling-elicitation-hang.git
cd ./cloudflare-sampling-elicitation-hang
npm install
npm run dev
```

In another tab:

```
npm run inspect
```

1. Try to invoke the `ask_for_poem` tool and it will hang indefinitely.
2. Try to invoke the `elicit_feedback` tool and it will hang indefinitely.
