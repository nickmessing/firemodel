# Model Constraints

Our first example was pretty basic and in our second one we're only going to add a bit but they are important changes to grok:

```typescript
@model(
  dbOffset: 'authenticated', 
  stateMgmt: 'in.the.tree', 
  plural: 'peeps', 
  audit: true)
export class Person extends Model {
  @property public name: string;
  @property public age: number;
  @property public gender?: "male" | "female" | "other";
}
```

Maybe not surprisingly the "model constaints" are meta properties about your model as a whole (versus on a specific property). Let's review these options:

1. `dbOffset` - this tells **FireModel** that all Person records should saved to the database off of the "authenticated" data path.
2. `stateMgmt` - similarly this property allows you to offset where in your state management tree you're going to store these Records. For more on this you should check the section on front-end state management.
3. `plural` - by default **FireModel** will pluralize your model name using standard rules. It should get it right most of the time but if you want to override this you can here. The reason the plural name is brought up is that the plural name is used in the storage path for both Firebase and your frontend state management.
4. `audit` - in cases where the given model hold very sensitive data you may want to opt-in to having all changes _audited_. For more on this see the [Auditing subsection](../using/auditing.html) in the Using section.