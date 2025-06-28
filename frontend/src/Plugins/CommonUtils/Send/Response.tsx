export function stringToResponse(response: string): Response {
    // Create a new Response object with the answer as the body
    const responseInit: ResponseInit = {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'text/plain',
        },
    }

    // Return a Response object
    return new Response(response, responseInit)
}
