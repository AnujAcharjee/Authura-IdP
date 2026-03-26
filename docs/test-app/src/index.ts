import app from './app.js';
import { CLIENT_URI, PORT } from './config.js';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test app running at ${CLIENT_URI}`);
});
