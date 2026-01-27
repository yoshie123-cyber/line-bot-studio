export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const response = await fetch('https://api.line.me/v2/bot/info', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        return res.status(200).json({
            displayName: data.displayName,
            pictureUrl: data.pictureUrl
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
