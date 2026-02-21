import { Router } from 'express';
import { oauthService } from '../services/oauth.service.js';
import { accountService } from '../services/account.service.js';
import { OAuthController } from '../controllers/oauth.controller.js';
import { OAuthZSchema } from '../validators/oauth.validator.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { Authentication, Authorize } from '../middlewares/authMiddleware.js';
import { OAuthMiddleware } from '../middlewares/oauthMiddleware.js';
import { JoseController } from '../controllers/jose.controller.js';
import { joseService } from '../services/jose.service.js';
import { clientService } from '../services/client.service.js';
import { ROLES } from '../utils/constant.js';

const router = Router();
const oauthController = new OAuthController(oauthService, accountService, clientService);
const joseController = new JoseController(joseService);

// TODO: implement isolated router for every client

// OAuth
router.get(
  '/api/oauth/authorize',
  validateRequest(OAuthZSchema.authorizeSchema),
  OAuthMiddleware.validateAndCacheReq,
  Authentication.ssr('oauth'),
  oauthController.authorize,
);

// is an ui router
router
  .route('/oauth/consent') 
  .get(Authentication.ssr('oauth'), Authorize.role([ROLES.USER]), oauthController.renderConsentPage)
  .post(
    Authentication.ssr('oauth'),
    Authorize.role([ROLES.USER]),
    validateRequest(OAuthZSchema.consentSchema),
    oauthController.consent,
  );

router.post('/api/oauth/token', validateRequest(OAuthZSchema.issueTokensSchema), oauthController.issueTokens);

router.route('/api/oauth/account/:id').get(Authentication.client, oauthController.getUserInfo);

// JWKS
router.get('/api/.well-known/jwks.json', joseController.getJwks);

export default router;
