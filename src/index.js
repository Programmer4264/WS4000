/**
 * Cloudflare Worker for WeatherStar 4000+
 *
 * Reads WSQS_* environment variables and injects them as URL query parameters
 * so that every visitor automatically lands on a pre-configured location and
 * display layout without touching the URL.
 *
 * Variable naming convention (same as the Express server and Docker image):
 *   WSQS_latLonQuery = "Orlando International Airport, Orlando, FL, USA"
 *   → redirects to /?latLonQuery=Orlando+International+Airport%2C+...
 *
 *   WSQS_hazards_checkbox = "false"
 *   → &hazards-checkbox=false
 *
 * The WSQS_ prefix is stripped and every underscore after the prefix becomes
 * a hyphen to match the query-string keys used by the application.
 */

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Collect all WSQS_* environment variables and build a query-string map
		const qsParams = {};
		for (const [key, value] of Object.entries(env)) {
			if (/^WSQS_[A-Za-z0-9_]+$/.test(key)) {
				// Strip the WSQS_ prefix and convert underscores to hyphens
				const formattedKey = key.replace(/^WSQS_/, '').replaceAll('_', '-');
				qsParams[formattedKey] = value;
			}
		}

		const hasQsVars = Object.keys(qsParams).length > 0;

		// Redirect bare root requests to include the environment variable parameters.
		// Requests that already carry a query string are passed through unchanged so
		// that users who arrive via a permalink or bookmark keep their own settings.
		if (hasQsVars && url.pathname === '/' && url.search === '') {
			const redirectUrl = new URL(url);
			redirectUrl.search = new URLSearchParams(qsParams).toString();
			return Response.redirect(redirectUrl.toString(), 307);
		}

		// Serve static assets from the /dist build output for all other requests
		return env.ASSETS.fetch(request);
	},
};
