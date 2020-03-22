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
  async (_, __, ctx: Context) => {
    if (!ctx.user) {
      return false;
    }
    return true;
  }
);

interface AskingForPersonArgs {
  uid?: string;
}
export const isOwnerRequestingPerson = rule({
  cache: 'strict'
})(async (_, args: AskingForPersonArgs, ctx: Context) => {
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
export const isOwnerLoggingContact = rule({
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

export const test = rule({
  cache: 'strict'
})(async (Parent, _, ctx: Context) => {
  console.log(JSON.stringify(Parent, null, 2));
  return true;
});

export default shield(
  {
    Query: {
      '*': isAdmin,
      Person: or(isAdmin, isOwnerRequestingPerson)
    },
    Mutation: {
      '*': isAdmin,
      UpdatePerson: or(isAdmin, isOwnerRequestingPerson),
      LogContact: or(isAdmin, isOwnerLoggingContact),
      UnlogContact: or(isAdmin, isOwnerLoggingContact)
    }
  },
  {
    debug: config.DEBUG
  }
);
