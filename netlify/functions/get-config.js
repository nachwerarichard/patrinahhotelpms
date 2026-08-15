exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // Allows your frontend to talk to this function without CORS errors
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      apiBaseUrl: process.env.API_BASE_URL || "http://localhost:5000",
    }),
  };
};