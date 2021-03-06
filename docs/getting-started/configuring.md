---
next: "/modeling/"
---

# Configuring FireModel

### Typescript

While it may be possible to use this framework without Typescript, it's not intended for the broader JS audience. So, assuming you're using Typescript, you'll want to edit your `tsconfig.json` file with the following two lines:

```json
{
  /** ... */
  "lib": ["es2017", "esnext.asynciterable", "es2015.reflect"],
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

This is primarily to ensure you can use decorators which are central to the syntax of **FireModel**. Strictly speaking you probably don't need the "es2017" library but that gives you async/await and let's be honest ... you really want that right?

### Next Step

Ok, you're next step is to use this tool to _model_ some data. Proceed to the Modeling section.
