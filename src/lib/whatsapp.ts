type WhatsAppSendResult = {
    ok: boolean;
    error?: string;
};

type SendWhatsAppTextInput = {
    to: string;
    body: string;
};

const getWhatsAppConfig = () => {
    const phoneId = process.env.WHATSAPP_PHONE_ID || "";
    const token = process.env.WHATSAPP_ACCESS_TOKEN || "";
    return { phoneId, token };
};

export const sendWhatsAppText = async ({ to, body }: SendWhatsAppTextInput): Promise<WhatsAppSendResult> => {
    const { phoneId, token } = getWhatsAppConfig();
    if (!phoneId || !token) {
        return { ok: false, error: "WHATSAPP_NOT_CONFIGURED" };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: { body },
            }),
        });

        if (!response.ok) {
            return { ok: false, error: `WHATSAPP_ERROR_${response.status}` };
        }

        return { ok: true };
    } catch (error) {
        console.error("WhatsApp send error:", error);
        return { ok: false, error: "WHATSAPP_NETWORK_ERROR" };
    }
};
