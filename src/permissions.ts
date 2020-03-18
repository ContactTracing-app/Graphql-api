import { rule, shield } from 'graphql-shield';
import { Context } from './app';

export const isAdmin = rule({
  cache: 'contextual'
})(async (_, __, ctx: Context) => {
  if (ctx.user) {
    return ctx.user.isAdmin;
  }
  return false;
});

export default shield({}, { fallbackRule: isAdmin });
