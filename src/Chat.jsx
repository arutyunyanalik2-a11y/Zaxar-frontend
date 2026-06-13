import React, { useState, useRef, useEffect } from 'react';
import { askAssistant } from "./assistant";
import { GoPaperAirplane } from "react-icons/go";
import {
    FaMicrophone, FaStop, FaBars, FaTimes,
    FaPlus, FaRegCommentAlt, FaTrashAlt,
    FaRegCopy, FaCheck,
    FaRegThumbsUp, FaThumbsUp, FaRegThumbsDown, FaThumbsDown,
    FaVolumeUp, FaVolumeMute, FaPaperclip,
    FaCog,
    FaPlay, FaPause, FaMusic // <-- Добавили FaMusic
} from "react-icons/fa";
import './style.css';
import zaxar from './Image/zaxar.png';

export default function Chat() {
    const [input, setInput] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [playingId, setPlayingId] = useState(null);

    // Состояния для файлов
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Состояния: Настройки и тема
    const [theme, setTheme] = useState(() => localStorage.getItem('zaxar_theme') || 'dark');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [chats, setChats] = useState(() => {
        const savedChats = localStorage.getItem('zahar_ai_sessions');
        if (savedChats) {
            const parsed = JSON.parse(savedChats);
            if (parsed.length > 0) return parsed;
        }
        return [{
            id: Date.now().toString(),
            title: 'Новый диалог',
            messages: [{ id: 'welcome', sender: 'ai', text: 'Привет! Я Захар, твой личный ИИ-помощник. Чем могу помочь?', audioUrl: null, feedback: null }]
        }];
    });

    const [activeChatId, setActiveChatId] = useState(chats[0]?.id);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('zaxar_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('zahar_ai_sessions', JSON.stringify(chats));
    }, [chats]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats, activeChatId, isLoading]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (audioRef.current) audioRef.current.pause();
        };
    }, []);

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
    const messages = activeChat?.messages || [];

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const toggleVoice = (audioUrl, id) => {
        if (!audioUrl) {
            alert("Для этого сообщения аудио недоступно.");
            return;
        }

        if (playingId === id) {
            if (audioRef.current) audioRef.current.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) audioRef.current.pause();
            const uniqueAudioUrl = `${audioUrl}?t=${Date.now()}`;
            const audio = new Audio(uniqueAudioUrl);
            audioRef.current = audio;

            audio.onended = () => setPlayingId(null);
            audio.onerror = () => {
                alert("Не удалось загрузить аудиофайл.");
                setPlayingId(null);
            };

            audio.play()
                .then(() => setPlayingId(id))
                .catch(err => console.error("Ошибка проигрывания:", err));
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 1500);
            });
    };

    const handleFeedback = (msgId, type) => {
        setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                const updatedMessages = chat.messages.map(msg => {
                    if (msg.id === msgId) {
                        return { ...msg, feedback: msg.feedback === type ? null : type };
                    }
                    return msg;
                });
                return { ...chat, messages: updatedMessages };
            }
            return chat;
        }));
    };

    const createNewChat = () => {
        const newChat = {
            id: Date.now().toString(),
            title: 'Новый диалог',
            messages: [{ id: 'welcome', sender: 'ai', text: 'Привет! Я Захар, твой личный ИИ-помощник. Слушаю тебя.', audioUrl: null, feedback: null }]
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
    };

    const deleteChat = (e, id) => {
        e.stopPropagation();
        setChats(prev => {
            const updated = prev.filter(c => c.id !== id);
            if (updated.length === 0) {
                const newChat = {
                    id: Date.now().toString(),
                    title: 'Новый диалог',
                    messages: [{ id: 'welcome', sender: 'ai', text: 'Привет! Я Захар. Чем могу помочь?', audioUrl: null, feedback: null }]
                };
                setActiveChatId(newChat.id);
                return [newChat];
            }
            if (id === activeChatId) setActiveChatId(updated[0].id);
            return updated;
        });
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Твой браузер не поддерживает голосовой ввод.");
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'ru-RU';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                setInput(prev => prev + (prev.length > 0 ? " " : "") + transcript);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
        try { recognitionRef.current.start(); } catch (e) { console.error(e); }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isLoading) return;
        if (isListening) recognitionRef.current.stop();

        const userText = input.trim();
        setInput('');

        const userMessage = {
            id: Date.now() + '-user',
            sender: 'user',
            text: userText,
            image: filePreview,
            feedback: null
        };

        const fileToSend = filePreview;
        clearFile();

        setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                const isFirstMessage = chat.messages.length === 1;
                const titleText = userText || "Картинка";
                const newTitle = isFirstMessage ? titleText.slice(0, 22) + (titleText.length > 22 ? '...' : '') : chat.title;
                return { ...chat, title: newTitle, messages: [...chat.messages, userMessage] };
            }
            return chat;
        }));

        setIsLoading(true);

        try {
            const currentChat = chats.find(c => c.id === activeChatId) || chats[0];
            const chatHistory = [...currentChat.messages, userMessage].map(msg => ({
                role: msg.sender === 'ai' ? 'assistant' : 'user',
                content: msg.text,
                image: msg.image
            }));

            const aiData = await askAssistant(chatHistory);
            const aiMessage = {
                id: Date.now() + '-ai',
                sender: 'ai',
                text: aiData.answer,
                audioUrl: aiData.audio_url,
                feedback: null
            };

            setChats(prev => prev.map(chat =>
                chat.id === activeChatId ? { ...chat, messages: [...chat.messages, aiMessage] } : chat
            ));
        } catch (error) {
            const errorMessage = { id: Date.now() + '-err', sender: 'ai', text: "Произошла ошибка при получении ответа.", audioUrl: null, feedback: null };
            setChats(prev => prev.map(chat =>
                chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
            ));
        } finally {
            setIsLoading(false);
        }
    };
    // --- ЛОГИКА ДЛЯ СВОЕЙ ФОНОВОЙ МУЗЫКИ ---
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicFileName, setMusicFileName] = useState('');
    const [musicUrl, setMusicUrl] = useState(null);

    const musicRef = useRef(null);
    const audioInputRef = useRef(null);

    // Обработчик загрузки файла
    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Очищаем старый URL из памяти браузера, если до этого играл другой трек
        if (musicUrl) {
            URL.revokeObjectURL(musicUrl);
        }

        const newUrl = URL.createObjectURL(file);
        setMusicUrl(newUrl);
        setMusicFileName(file.name);
        setIsMusicPlaying(true); // Автоматически включаем после загрузки
    };

    // Эффект плеера
    useEffect(() => {
        if (musicUrl) {
            if (!musicRef.current) {
                musicRef.current = new Audio(musicUrl);
                musicRef.current.loop = true;
                musicRef.current.volume = 0.4;
            } else {
                musicRef.current.src = musicUrl;
            }

            if (isMusicPlaying) {
                musicRef.current.play().catch(err => console.error("Ошибка автозапуска:", err));
            }
        }
    }, [musicUrl]);

    // Управление паузой/воспроизведением
    useEffect(() => {
        if (!musicRef.current) return;

        if (isMusicPlaying) {
            musicRef.current.play().catch(err => console.error("Ошибка воспроизведения:", err));
        } else {
            musicRef.current.pause();
        }
    }, [isMusicPlaying]);
    return (
        <>

            <div className={`chat-wrapper ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'} theme-${theme}`}>

                {/* СТРОГО ЦЕНТРИРОВАННОЕ МОДАЛЬНОЕ ОКНО С МУЗЫКОЙ И ЭКВАЛАЙЗЕРОМ */}
                {isSettingsOpen && (
                    <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
                        <div className="settings-modal" onClick={e => e.stopPropagation()}>
                            <div className="settings-header">
                                <h3>Настройки интерфейса</h3>
                                <button className="modal-close-btn" onClick={() => setIsSettingsOpen(false)}>
                                    <FaTimes size={16} />
                                </button>
                            </div>
                            <div className="settings-body">
                                <div className="setting-row">
                                    <span className="setting-label">Тема оформления:</span>
                                    <div className="theme-options-container">
                                        <button
                                            className={`theme-picker-btn light-pick ${theme === 'light' ? 'active-theme' : ''}`}
                                            onClick={() => setTheme('light')}
                                        >
                                            Светлая
                                        </button>
                                        <button
                                            className={`theme-picker-btn dark-pick ${theme === 'dark' ? 'active-theme' : ''}`}
                                            onClick={() => setTheme('dark')}
                                        >
                                            Тёмная
                                        </button>
                                    </div>
                                </div>

                                <hr className="settings-divider" />

                                <div className="setting-row">
                                    <span className="setting-label">Фоновая музыка:</span>

                                    <input
                                        type="file"
                                        accept="audio/*"
                                        ref={audioInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleAudioUpload}
                                    />

                                    <div className="music-block-control" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                                        {/* Кнопка загрузки трека */}
                                        <button
                                            className="theme-picker-btn"
                                            onClick={() => audioInputRef.current.click()}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                                        >
                                            <FaMusic size={12} />
                                            {musicFileName ? "Выбрать другой файл" : "Загрузить трек с устройство"}
                                        </button>

                                        {musicUrl && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
                                                <button
                                                    className={`music-action-btn ${isMusicPlaying ? 'music-playing' : ''}`}
                                                    onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                                                >
                                                    {isMusicPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
                                                    <span>{isMusicPlaying ? "Пауза" : "Играть"}</span>
                                                </button>

                                                {/* ЭКВАЛАЙЗЕР */}
                                                <div className={`css-equalizer ${isMusicPlaying ? 'active' : ''}`}>
                                                    <span className="eq-bar bar-1"></span>
                                                    <span className="eq-bar bar-2"></span>
                                                    <span className="eq-bar bar-3"></span>
                                                    <span className="eq-bar bar-4"></span>
                                                    <span className="eq-bar bar-5"></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Вывод имени загруженного трека */}
                                    {musicFileName && (
                                        <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', wordBreak: 'break-all', display: 'block' }}>
                                            ̂ {musicFileName}
                                        </span>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                <aside className="chat-sidebar">
                    <div className="sidebar-header">
                        <button className="new-chat-btn" onClick={createNewChat}>
                            <FaPlus size={14} />
                            <span>Новый чат</span>
                        </button>
                        <button className="close-menu-btn" onClick={() => setIsSidebarOpen(false)}>
                            <FaTimes size={18} />
                        </button>
                    </div>

                    <div className="sidebar-history-title">История диалогов</div>
                    <nav className="sidebar-menu">
                        {chats.map(chat => (
                            <div key={chat.id} className={`history-item ${chat.id === activeChatId ? 'active' : ''}`} onClick={() => setActiveChatId(chat.id)}>
                                <FaRegCommentAlt className="history-icon" />
                                <span className="history-text">{chat.title}</span>
                                <button className="delete-chat-btn" onClick={(e) => deleteChat(e, chat.id)} title="Удалить чат">
                                    <FaTrashAlt size={12} />
                                </button>
                            </div>
                        ))}
                    </nav>
                </aside>

                <div className="chat-box">
                    <div className='chat-header'>
                        <div className="header-left-zone">
                            {!isSidebarOpen && (
                                <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
                                    <FaBars size={20} />
                                </button>
                            )}
                            <img className='avatar-status' src={zaxar} alt="Захар" />
                            <div className="header-titles">
                                <h2>Захар</h2>
                                <span className="ai-subtitle">ИИ-ассистент Voxel Rivo</span>
                            </div>
                        </div>
                        <div className="header-right-zone">
                            <button className="header-settings-btn" onClick={() => setIsSettingsOpen(true)} title="Настройки">
                                <FaCog size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages-area">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`message-row ${msg.sender}`}>
                                <div className="message-bubble">
                                    {msg.image && (
                                        <img src={msg.image} alt="Прикрепленный файл" className="message-attached-img" />
                                    )}
                                    {msg.text && <p>{msg.text}</p>}

                                    <div className="message-actions-bar">
                                        {msg.sender === 'ai' && (
                                            <>
                                                <button
                                                    className={`action-msg-btn voice-btn ${playingId === msg.id ? 'active-voice' : ''}`}
                                                    onClick={() => toggleVoice(msg.audioUrl, msg.id)}
                                                    disabled={!msg.audioUrl}
                                                    title={playingId === msg.id ? "Остановить" : "Прослушать голос"}
                                                >
                                                    {playingId === msg.id ? <FaVolumeMute size={13} color="#eab308" /> : <FaVolumeUp size={13} />}
                                                </button>

                                                <button className={`action-msg-btn ${msg.feedback === 'like' ? 'active-like' : ''}`} onClick={() => handleFeedback(msg.id, 'like')} title="Полезный ответ">
                                                    {msg.feedback === 'like' ? <FaThumbsUp size={11} /> : <FaRegThumbsUp size={11} />}
                                                </button>
                                                <button className={`action-msg-btn ${msg.feedback === 'dislike' ? 'active-dislike' : ''}`} onClick={() => handleFeedback(msg.id, 'dislike')} title="Плохой ответ">
                                                    {msg.feedback === 'dislike' ? <FaThumbsDown size={11} /> : <FaRegThumbsDown size={11} />}
                                                </button>
                                            </>
                                        )}

                                        <button className="action-msg-btn copy-btn" onClick={() => handleCopy(msg.text, msg.id)} title="Копировать текст">
                                            {copiedId === msg.id ? <FaCheck size={11} color="#22c55e" /> : <FaRegCopy size={11} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message-row ai">
                                {/* <div className="message-bubble loading-bubble"> */}
                                    <img className='dumAI' src={zaxar} alt="" />
                                    {/* <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span> */}
                                {/* </div> */}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                        <p className='pzax'>Захар — это искусственный интеллект, и ему свойственно ошибаться. Проверяйте важные данные.</p>
                    </div>

                    <div className="input-container-wrapper">
                        {filePreview && (
                            <div className="file-preview-box">
                                {selectedFile?.type.startsWith('image/') ? (
                                    <img src={filePreview} alt="Превью" className="preview-img-thumb" />
                                ) : (
                                    <span className="preview-file-name">{selectedFile?.name}</span>
                                )}
                                <button onClick={clearFile} className="remove-file-btn"><FaTimes size={12} /></button>
                            </div>
                        )}

                        <div className="chat-input-area">
                            <button className="attach-btn" onClick={() => fileInputRef.current.click()} title="Прикрепить файл">
                                <FaPaperclip size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="image/*"
                            />

                             <textarea
                                className="chat-field"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                   
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={isListening ? "Слушаю вас..." : "Напишите сообщение..."}
                                disabled={isLoading}
                                rows={1}
                            />


                            <button onClick={toggleListening} disabled={isLoading} className={`mic-btn ${isListening ? 'listening' : ''}`}>
                                {isListening ? <FaStop size={16} /> : <FaMicrophone size={16} />}
                            </button>

                            <button className="send-btn" onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedFile)}>
                                <GoPaperAirplane size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}
