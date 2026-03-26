## Follow these steps to register your application:

1. Go to:  
   https://pramaan.anujacharjee.com/account

2. Navigate to **Registered Clients** (Developer Section)

3. Click **Create OAuth Client**

4. Fill in the required details (Client Configuration Fields):

#### Client Name

The public-facing name of your application.  
This will be shown to users during authentication and consent screens.

#### Client Domain

Used to generate client-specific API routes.  
_(Coming soon)_

#### Client Type

Choose based on your application architecture:

- **Confidential** — For server-side applications (recommended).  
  Use this if your application runs on a backend server that can securely store secrets.

- **Public** — For SPAs and Mobile applications.  
  Use this if your application runs in the browser or on a user device.  
  Client secrets cannot be securely stored in these environments.

#### Environment

- **Development**  
  Allows `http://` redirect URIs for local development.

- **Production (Recommended)**  
  Allows only `https://` redirect URIs.

> ⚠ Even during development, using Production is recommended because some browsers block redirects from `https` to `http`.

#### Redirect URI

The endpoint on your application that will receive the **Authorization Code** from Pramaan after successful authentication.

Example:
`https://yourapp.com/auth/callback`

5. Click **Create Client**

🎉 Congratulations! Your OAuth client has been created.

## After Client Creation

You will be redirected to your **Client Dashboard**, where you can:

- View client configuration
- Manage redirect URIs
- Regenerate credentials
- Update environment settings

## Important Notes

- The **Client ID** is displayed only once immediately after creation.  
  Store it securely.

- If lost, you can generate a new Client ID.  
  However, you must update it in your application configuration.
