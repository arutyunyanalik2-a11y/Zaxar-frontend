import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Billing.css'; // Импортируем отдельный файл со стилями

export default function Billing() {
    const phrases = [
        "Быстрые ответы ",
        "Безлимитные запросы ",
        "Намного умнее ",
        "Захар Плюс "
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    // Состояния для логики восстановления подписки по Email
    const [isRestoring, setIsRestoring] = useState(false);
    const [email, setEmail] = useState('');

    // Логика автоматического переключения фраз
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        }, 2500); // Менять фразу каждые 2.5 секунды

        return () => clearInterval(interval);
    }, []);

    // Функция обработки восстановления подписки
    const handleRestoreSubmit = (e) => {
        e.preventDefault();
        if (!email) {
            alert('Пожалуйста, введите ваш Email');
            return;
        }
        
        // Здесь в будущем будет fetch-запрос к твоему бэкенду/Lemon Squeezy
        alert(`Запрос отправлен! Проверяем подписку для: ${email}. Если оплата была совершена, Захар Plus активируется на этом устройстве.`);
        
        // Сбрасываем форму после отправки
        setEmail('');
        setIsRestoring(false);
    };

    return (
        <div className="billing-container">
            <div>
                <h1>
                    Выбирай тариф и наслаждайся общением с Захаром!
                </h1>
            </div>

            {/* Кнопка Назад */}
            <Link to="/" className="back-btn">
                ← Назад в чат
            </Link>

            <div className="billing-main-layout">

                <div className="billing-left-carousel">
                    <span className="carousel-subtitle">Что дает подписка:</span>
                    <div className="carousel-wrapper">
                        {phrases.map((phrase, index) => {
                            let className = "carousel-text";
                            if (index === currentIndex) className += " active";
                            if (index === phrases.length - 1) className += " special-brand";

                            return (
                                <h2 key={index} className={className}>
                                    {phrase}
                                </h2>
                            );
                        })}
                    </div>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: Карточки цен и блок восстановления */}
                <div className="pricing-right-section">
                    <div className="pricing-grid">

                        {/* Бесплатный тариф */}
                        <div className="price-card">
                            <div className="card-title">Обычный Захар</div>
                            <div className="card-price">$0<span>/ навсегда</span></div>
                            <ul className="features-list">
                                <li>Базовые ответы ИИ</li>
                                <li>Стандартная скорость</li>
                                <li>Ограниченные лимиты</li>
                            </ul>
                            <button className="action-btn" onClick={() => alert('Ты уже используешь этот тариф!')}>
                                Активен
                            </button>
                        </div>

                        {/* PRO тариф */}
                        <div className="price-card pro">
                            <div className="badge">лучше во всём</div>
                            <div className="card-title">Захар Plus</div>
                            <div className="card-price">$3.99<span>/ 30 дней</span></div>
                            <ul className="features-list">
                                <li>Умные и солидные ответы</li>
                                <li>Мгновенная генерация</li>
                                <li>Безлимитный доступ</li>
                                <li>Без авто-списаний</li>
                                <li>Более качественные ответы</li>
                            </ul>
                            <button className="action-btn pro-btn" onClick={() => alert('Кнопка работает! Скоро здесь откроется оплата Lemon Squeezy.')}>
                                Активировать Plus
                            </button>
                        </div>

                    </div>

                    {/* БЛОК ВОССТАНОВЛЕНИЯ ПОДПИСКИ */}
                    <div className="restore-box">
                        {!isRestoring ? (
                            <button className="restore-trigger-btn" onClick={() => setIsRestoring(true)}>
                                Уже покупали подписку на другом устройстве?
                            </button>
                        ) : (
                            <form onSubmit={handleRestoreSubmit} className="restore-form animate-fade-in">
                                <p className="restore-instructions">
                                    Введите Email, который вы указывали при оплате через Lemon Squeezy, чтобы активировать Захар Plus:
                                </p>
                                <div className="restore-input-group">
                                    <input 
                                        type="email" 
                                        placeholder="your-email@example.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="restore-email-input"
                                        required
                                    />
                                    <button type="submit" className="restore-submit-btn">
                                        Активировать
                                    </button>
                                </div>
                                <button type="button" className="restore-cancel-btn" onClick={() => setIsRestoring(false)}>
                                    Отмена
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        );
    }