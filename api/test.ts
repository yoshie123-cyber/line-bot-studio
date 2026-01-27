export default function handler(req: any, res: any) {
    res.status(200).json({
        message: "API Environment Test Success",
        time: new Date().toLocaleString('ja-JP'),
        nodeVersion: process.version,
        env: process.env.NODE_ENV
    });
}
