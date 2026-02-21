import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authService } from '../services/auth.service.js';
import { sessionService } from '../services/session.service.js';
import { oauthService } from '../services/oauth.service.js';
import { AccountZSchema } from '../validators/account.validators.js';
import { ClientZSchema } from '../validators/client.validators.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { Authentication, Authorize } from '../middlewares/authMiddleware.js';
import { ROLES } from '../utils/constant.js';
import { forgotPasswordLimiter, signupLimiter, signinLimiter } from '../middlewares/rateLimiter.js';
import { AccountController } from '../controllers/account.controller.js';
import { accountService } from '../services/account.service.js';
import { clientService } from '../services/client.service.js';
import { ClientController } from '../controllers/client.controller.js';
import { LandingController } from '../controllers/landing.controller.js';
import { emailVerificationLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
const landingController = new LandingController();
const authController = new AuthController(authService, oauthService);
const accountController = new AccountController(
  accountService,
  authService,
  oauthService,
  clientService,
  sessionService,
);
const clientController = new ClientController(clientService, accountService);

// ------------------- Landing -------------------

router.get('/', landingController.renderLandingPage);

/** ----------------- AUTH ----------------- */

router.route('/signup').get(authController.renderSignupForm).post(signupLimiter, authController.signup);

router.get('/verify', authController.renderEmailVerificationPage);
router.get('/email/verify', authController.verifyEmail);

router.get('/verify/resend', emailVerificationLimiter, authController.resendVerificationEmail);

router.route('/signin').get(authController.renderSigninForm).post(signinLimiter, authController.signin);

router.get('/signin/verify', authController.verifySignin);

router
  .route('/forgot-password')
  .get(authController.renderForgotPasswordForm)
  .post(forgotPasswordLimiter, authController.forgotPassword);

router
  .route('/reset-password')
  .get(authController.renderResetPasswordForm)
  .post(authController.resetPassword);

router.post('/signout', Authentication.ssr('default'), Authorize.role([ROLES.USER]), authController.signout);

/** ----------------- ACCOUNT ----------------- */

router
  .route('/account')
  .get(Authentication.ssr('default'), Authorize.role([ROLES.USER]), accountController.renderAccountDashboard)
  .put(
    Authentication.ssr('default'),
    Authorize.role([ROLES.USER]),
    validateRequest(AccountZSchema.updateProfileSchema),
    accountController.updateProfile,
  )
  .delete(Authentication.ssr('default'), Authorize.role([ROLES.USER]), accountController.delete);

router.post(
  '/account/mfa',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER]),
  validateRequest(AccountZSchema.manageMfaSchema),
  accountController.manageMfa,
);

router.post(
  '/account/change-password',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER]),
  validateRequest(AccountZSchema.changePasswordSchema),
  accountController.changePassword,
);

router.post(
  '/account/deactivate',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER]),
  accountController.deactivate,
);
router.post(
  '/account/activate',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER]),
  accountController.activate,
);

router.post(
  '/consent/revoke',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER]),
  validateRequest(AccountZSchema.updateConsentSchema),
  accountController.revokeConsent,
);

router.post(
  '/consent/reissue',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER]),
  validateRequest(AccountZSchema.updateConsentSchema),
  accountController.reissueConsent,
);

router.get(
  '/account/:action',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER]),
  accountController.renderAccountConfirmation,
);

router
  .route('/create-client')
  .get(
    Authentication.ssr('default'),
    Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
    clientController.renderAddClient,
  )
  .post(
    Authentication.ssr('default'),
    Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
    validateRequest(ClientZSchema.addClientSchema),
    clientController.addClient,
  );

/** ----------------- CLIENT ----------------- */

// TODO: implement isolated router for every client

router
  .route('/client/:client_id')
  .get(
    Authentication.ssr('default'),
    Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
    Authorize.clientOwnership,
    validateRequest(ClientZSchema.clientIdSchema),
    clientController.renderClientDashboard,
  )
  .delete(
    Authentication.ssr('default'),
    Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
    Authorize.clientOwnership,
    validateRequest(ClientZSchema.clientIdSchema),
    clientController.delete,
  )
  .put(
    Authentication.ssr('default'),
    Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
    Authorize.clientOwnership,
    validateRequest(ClientZSchema.clientIdSchema),
    clientController.deactivate,
  );

router.get(
  '/client/:client_id/:action',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
  Authorize.clientOwnership,
  validateRequest(ClientZSchema.clientIdSchema),
  clientController.renderClientConfirmation,
);

router.post(
  '/client/:client_id/activate',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
  Authorize.clientOwnership,
  validateRequest(ClientZSchema.clientIdSchema),
  clientController.activate,
);

router.post(
  '/client/:client_id/ruri',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
  Authorize.clientOwnership,
  validateRequest(ClientZSchema.manageRedirectsSchema),
  clientController.manageRedirects,
);

router.post(
  '/client/:client_id/environment',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
  Authorize.clientOwnership,
  validateRequest(ClientZSchema.updateEnvironmentSchema),
  clientController.updateClientEnvironment,
);

router.post(
  '/client/rotate-secret',
  Authentication.ssr('default'),
  Authorize.role([ROLES.USER, ROLES.DEVELOPER]),
  Authorize.clientOwnership,
  validateRequest(ClientZSchema.rotateSecretSchema),
  clientController.rotateClientSecret,
);

export default router;
