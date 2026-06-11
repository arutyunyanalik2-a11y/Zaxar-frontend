export async function askAssistant(userMessage) {
    try {
        const response = await fetch('https://zaxar-backend.onrender.com/api/assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        });

        if (!response.ok) {
            throw new Error('Ошибка сети или сервера');
        }

        const data = await response.json();
        // Возвращаем объект целиком (в нем есть data.answer и data.audio_url)
        return data;

    } catch (error) {
        console.error("Ошибка при связи с ассистентом:", error);
        return {
            answer: "Ошибка связи с сервером. Проверь, запущен ли Python!",
            audio_url: null
        };
    }
}