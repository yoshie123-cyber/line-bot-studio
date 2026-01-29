import * as line from '@line/bot-sdk';
import { Buffer } from 'buffer';

export const config = {
    api: {
        bodyParser: true,
    },
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { token, richMenu } = req.body;

    if (!token || !richMenu) {
        return res.status(400).json({ success: false, error: 'Token and Rich Menu config are required' });
    }

    const client = new line.Client({ channelAccessToken: token });

    try {
        // 1. Prepare Rich Menu Object
        const isSix = richMenu.layout === 'six';
        const height = 1686;
        const width = 2500;

        const areas: any[] = [];
        const colWidth = Math.floor(width / 3);
        const rowHeight = Math.floor(height / 2);

        if (isSix) {
            // 2 rows, 3 cols
            for (let i = 0; i < 6; i++) {
                const row = Math.floor(i / 3);
                const col = i % 3;
                areas.push({
                    bounds: {
                        x: col * colWidth,
                        y: row * rowHeight,
                        width: colWidth,
                        height: rowHeight
                    },
                    action: {
                        type: richMenu.buttons[i].type,
                        label: richMenu.buttons[i].label,
                        uri: richMenu.buttons[i].type === 'uri' ? richMenu.buttons[i].value : undefined,
                        text: richMenu.buttons[i].type === 'message' ? richMenu.buttons[i].value : undefined,
                    }
                });
            }
        } else {
            // 1 row (bottom half as per UI design), 3 cols
            for (let i = 0; i < 3; i++) {
                areas.push({
                    bounds: {
                        x: i * colWidth,
                        y: rowHeight, // Bottom half
                        width: colWidth,
                        height: rowHeight
                    },
                    action: {
                        type: richMenu.buttons[i].type,
                        label: richMenu.buttons[i].label,
                        uri: richMenu.buttons[i].type === 'uri' ? richMenu.buttons[i].value : undefined,
                        text: richMenu.buttons[i].type === 'message' ? richMenu.buttons[i].value : undefined,
                    }
                });
            }
        }

        const richMenuObj: line.RichMenu = {
            size: { width: 2500, height: 1686 },
            selected: true,
            name: `Studio Menu ${new Date().getTime()}`,
            chatBarText: richMenu.chatBarText || 'メニュー',
            areas
        };

        // 2. Create Rich Menu
        const richMenuId = await client.createRichMenu(richMenuObj);

        // 3. Upload Image (if provided)
        if (richMenu.backgroundImageUrl) {
            let buffer: Buffer;
            let contentType: string;

            try {
                const imgRes = await fetch(richMenu.backgroundImageUrl);
                if (!imgRes.ok) {
                    throw new Error(`画像の取得に失敗しました (HTTP ${imgRes.status})。URLが公開されているか確認してください。`);
                }

                contentType = imgRes.headers.get('content-type') || '';
                const contentLength = parseInt(imgRes.headers.get('content-length') || '0');

                if (contentType.includes('text/html')) {
                    throw new Error('指定されたURLは画像ではなく「Webページ」です。右クリックして「画像アドレスをコピー」したURLを使用してください。');
                }

                if (contentLength > 1024 * 1024) {
                    throw new Error(`画像サイズが大きすぎます (${(contentLength / 1024 / 1024).toFixed(1)}MB)。1MB以下の画像を使用してください。`);
                }

                buffer = Buffer.from(await imgRes.arrayBuffer());

                // Final check on buffer size if contentLength was missing
                if (buffer.length > 1024 * 1024) {
                    throw new Error(`画像データが1MBを超えています (${(buffer.length / 1024 / 1024).toFixed(1)}MB)。`);
                }

            } catch (fetchErr: any) {
                console.error('[RichMenu] Fetch/Validation Failed:', fetchErr);
                await client.deleteRichMenu(richMenuId);
                return res.status(400).json({ success: false, error: fetchErr.message });
            }

            try {
                await client.setRichMenuImage(richMenuId, buffer, contentType || 'image/png');
            } catch (lineErr: any) {
                console.error('[RichMenu] LINE Image Upload Failed:', lineErr);
                await client.deleteRichMenu(richMenuId);
                // Extract detailed error from LINE API if available
                const detail = lineErr.body?.message || lineErr.message || '不明なエラー';
                return res.status(400).json({
                    success: false,
                    error: `LINEへの画像アップロードに失敗しました: ${detail}\n※画像サイズは2500x1686 または 2500x843、形式はPNG/JPGである必要があります。`
                });
            }
        }

        // 4. Set as Default
        await client.setDefaultRichMenu(richMenuId);

        // 5. Cleanup (Delete old ones to avoid reaching limit of 1000)
        // This is optional but recommended
        const oldMenus = await client.getRichMenuList();
        for (const menu of oldMenus) {
            if (menu.richMenuId !== richMenuId) {
                try {
                    await client.deleteRichMenu(menu.richMenuId);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }

        return res.status(200).json({ success: true, richMenuId });

    } catch (e: any) {
        console.error('[RichMenu] Error:', e);
        return res.status(500).json({
            success: false,
            error: e.message || 'LINE APIとの通信中にエラーが発生しました。アクセストークンを確認してください。'
        });
    }
}
