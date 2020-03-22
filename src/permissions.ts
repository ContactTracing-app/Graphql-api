import { rule, shield, or } from 'graphql-shield';
import { Context } from './app';
import config from './appConfigs';

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

interface PersonArgs {
  uid?: string;
}
export const isPersonOwner = rule({
  cache: 'strict'
})(async (_, args: PersonArgs, ctx: Context) => {
  const { uid } = args;

  if (!ctx.user) {
    return false;
  }

  if (!uid) {
    return false;
  }

  return uid === ctx.user.uid;
});

interface LogContactArgs {
  input: {
    fromUid: string;
  };
}

// You can only Log your own entries
export const isContactLogger = rule({
  cache: 'strict'
})(async (_, args: LogContactArgs, ctx: Context) => {
  const {
    input: { fromUid }
  } = args;

  if (!ctx.user) {
    return false;
  }

  return fromUid === ctx.user.uid;
});

export default shield(
  {
    Query: {
      '*': isAdmin,
      Person: or(isAdmin, isPersonOwner)
    },
    Mutation: {
      '*': isAdmin,
      UpdatePerson: or(isAdmin, isPersonOwner),
      LogContact: or(isAdmin, isContactLogger),
      UnlogContact: or(isAdmin, isContactLogger)
    }
  },
  {
    debug: config.DEBUG
  }
);
