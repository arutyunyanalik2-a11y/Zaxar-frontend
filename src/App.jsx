import Chat from "./Chat";
import Billing from "./Billing"; // 1. Импортируй свой новый компонент оплаты (создай файл Billing.jsx рядом с Chat.jsx)
import { Analytics } from "@vercel/analytics/react";
// 2. Импортируем нужные инструменты для роутинга
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      {/* 3. Оборачиваем роуты в BrowserRouter */}
      <BrowserRouter>
        <Routes>
          {/* Главная страница (по адресу /) будет показывать твой привычный Чат */}
          <Route path="/" element={<Chat />} />
          
          {/* Страница оплаты (по адресу /billing) будет показывать экран покупки Pro */}
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </BrowserRouter>
      
      {/* Аналитика Vercel остается работать на фоне для всего приложения */}
      <Analytics />
    </>
  );
}

export default App;