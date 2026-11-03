Sukoon prototype: deployment

1. Install Node.js 20 or newer.
2. Run npm install.
3. Set MONGODB_URI as a server environment variable to your MongoDB Atlas connection string, and JWT_SECRET to a long random value. Never put these values in a public repository. Rotate credentials previously shared in chat.
4. Run npm start. Open http://localhost:3000.

For a permanent test URL, deploy as a Node web service on a host such as Render or Railway, configure the above environment variables there, and use npm install as the build command and npm start as the start command. Atlas must allow connections from the hosting provider. Without an Atlas connection, this prototype uses non-durable local demo storage; this is not suitable for production.

Verse source and MIT licence are in public/VERSE-LICENSE.txt and the app footer. This prototype requires production security review before public release.
