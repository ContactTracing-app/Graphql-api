import { rule, shield, or } from 'graphql-shield';
import { Context } from './app';

export const isAdmin = rule({ cache: 'contextual' })(
  async (_, __, ctx: Context) => {
    if (ctx.user) {
      return ctx.user.isAdmin;
    }
    return false;
  }
);

export const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context) => {
    return ctx.user !== null;
  }
);

interface Person {
  uid: string;
}
export const isOwner = rule({
  cache: 'contextual',
  fragment: 'fragment PersonUid on Person { uid }'
})(async (Person: Person, _, ctx: Context) => {
  console.log(Person);
  if (ctx.user) {
    return Person.uid === ctx.user.uid;
  }
  return false;
});

export default shield(
  {
    Query: {
      '*': or(isAdmin, isOwner)
    },
    Mutation: {
      '*': isAdmin
    },
    Person: {
      '*': or(isAdmin, isOwner)
    }
  },
  {
    debug: true
  }
);
