/**
 * @interface
 * @description Defines a interface on ApiRouter.
 * @exports ApiRouter
 */

import { Router } from "express";

interface ApiRouter {
  path: string;
  router: Router;
}

export default ApiRouter;
