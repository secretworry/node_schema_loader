# schema_loader

Load data against tree-like schema

[![Build Status](https://travis-ci.org/secretworry/node_schema_loader.svg?branch=master)](https://travis-ci.org/secretworry/node_schema_loader.svg?branch=master)

## Why schema loader?

When exporting data to the user, apart from exporting entities directly, we need to compose different associated entities
to form a compound before sending it out. Asynchorous loading those associations while composing them into a tree,
is not only tedious, but error-prone. So we borrowed the idea from GraphQL, using a predefined schema to describe the
whole process, and let the framework to finish the dirty work.

## Define Schema

Schema is a tree composed by various Node. Each node, defined through a object in Definition, represents an object,
an array of object or a property in the final Document.

We can define a schema using `Schema.fromDefinition(definition)` as following
```javascript
const userSchema = Schema.fromDefinition({
  firstName: field('first_name'),
  lastName: field('last_name'),
  gender: field(),
  name: {
    __resolver__: (parent, info) => [parent.first_name, parent.last_name].join(' ')
  },
  avatar: {
    __resolver__: (parent, info) => batch(loadImage, [parent.avatar_id], (images) => images[parent.avatar_id])
  }
}
```

or extend an existing schema
```javascript
const userSchemaWithFriends = Schema.extend(userSchema, {
  friends: Schema.extend(userSchema, {
    __resolver__: (parent, info) => loadFriends(parent.user_id)
  })
})
```

## Resolve Schema to document

After defining a schema, we can resolve schema to document using `resolve(schema, rootValue, ?options): Promise`.
the rootValue can be a object or an Promise resolves to a target object.

if we have a user defined as:
```javascript
let user = {
  first_name: 'Jim',
  last_name: 'Green',
  gender: 'male',
  avatar: 1
}
```
resolving the user against `userSchema` as `resolve(userSchema, user).then((document) => console.log(document))`, we will
get:
```javascript
{
  firstName: 'Jim',
  lastName: 'Green',
  name: 'Jim Green',
  gender: 'male',
  avatar: 'http://www.example.com/avatars/1.png'
}
```


