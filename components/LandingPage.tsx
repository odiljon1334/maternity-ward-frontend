"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown, Menu, X, Check, Star, Heart, Shield,
  Clock, Users, Award, Phone, Instagram, Facebook,
  Youtube, ArrowRight, Sparkles, MapPin, Mail,
  Baby, Stethoscope, CalendarCheck, TrendingUp,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TYPING_WORDS = ["вашего малыша", "вашей семьи", "новой жизни", "счастливого материнства"];

const AVATAR_IDS = [
  "1494790108755-2616b612b786",
  "1507003211169-0a1dd7228f2d",
  "1438761681033-6461ffad8d80",
  "1500648767791-00dcc994a43e",
  "1534528741775-53994a69daeb",
];

const PARTNERS = ["НациональныйМед", "ЕвроКлиника", "Медскан", "Роддом №5", "ПеринатПлюс", "СемьяМед"];

const FEATURES = [
  {
    icon: <Heart size={22} color="white" />,
    title: "Индивидуальный уход",
    desc: "Каждая беременность уникальна. Персональный план ведения составляется с первой консультации, учитывая все особенности вашего здоровья и пожелания семьи.",
    side: "left",
  },
  {
    icon: <Users size={22} color="white" />,
    title: "Команда экспертов",
    desc: "Акушеры-гинекологи и неонатологи высшей категории с международными сертификатами и опытом от 15 лет.",
    side: "right",
  },
  {
    icon: <Shield size={22} color="white" />,
    title: "Современное оборудование",
    desc: "4D УЗИ, КТГ-мониторинг, операционные класса А — безопасность и точность на каждом этапе.",
    side: "right",
  },
  {
    icon: <Clock size={22} color="white" />,
    title: "Поддержка 24/7",
    desc: "Горячая линия и дежурный врач круглосуточно. Никогда не останетесь одна с тревогой или вопросом.",
    side: "left",
  },
  {
    icon: <Sparkles size={22} color="white" />,
    title: "Психологическая поддержка",
    desc: "Перинатальные психологи сопровождают от тревог беременности до послеродовой адаптации.",
    side: "left",
  },
  {
    icon: <Award size={22} color="white" />,
    title: "Комфортные палаты",
    desc: "Номера гостиничного класса с условиями для мамы, ребёнка и партнёра. Отдельный санузел, умный TV, меню ресторанного уровня.",
    side: "right",
  },
];

const STEPS = [
  {
    num: "01",
    icon: <CalendarCheck size={28} color="#EC4899" />,
    title: "Первичная консультация",
    desc: "Знакомимся с вами и вашей историей. Отвечаем на вопросы без спешки. Только забота.",
  },
  {
    num: "02",
    icon: <Stethoscope size={28} color="#EC4899" />,
    title: "Составление плана",
    desc: "Персональный план обследований и наблюдения. Выбор методики родоразрешения — вместе с вами.",
  },
  {
    num: "03",
    icon: <Baby size={28} color="#EC4899" />,
    title: "Роды и поддержка",
    desc: "Безопасные роды в комфортных условиях. Послеродовое наблюдение и поддержка вскармливания.",
  },
];

const TESTIMONIALS = [
  {
    featured: true,
    text: "MaterCare подарил мне ощущение безопасности и заботы в каждый момент. Акушерка Ольга держала мою руку всё время родов. Я вернусь сюда со вторым ребёнком без сомнений.",
    name: "Анастасия К.",
    role: "Мама двойняшек · Москва",
    date: "Март 2024",
    avatar: AVATAR_IDS[0],
  },
  {
    featured: false,
    text: "Наблюдалась всю беременность здесь. Никаких очередей, внимательный персонал, исчерпывающие ответы. Роды прошли без осложнений — спасибо доктору Семёновой!",
    name: "Елена В.",
    role: "Блогер · @elena_mama",
    date: "Январь 2024",
    avatar: AVATAR_IDS[2],
  },
  {
    featured: false,
    text: "Мы выбирали долго. MaterCare — единственные, кто провёл экскурсию по роддому и ответил на 40 наших вопросов. Это дорогого стоит. Сын родился здоровым.",
    name: "Мария Л.",
    role: "Предприниматель · Москва",
    date: "Декабрь 2023",
    avatar: AVATAR_IDS[4],
  },
];

const PLANS = [
  {
    tier: "basic" as const,
    icon: <Heart size={18} />,
    name: "Стандарт",
    desc: "Всё необходимое для безопасной беременности и родов",
    month: 150000,
    year: 120000,
    features: [
      { t: "Ведение беременности (10 визитов)", ok: true },
      { t: "Роды в общей палате", ok: true },
      { t: "Неонатолог 3 дня", ok: true },
      { t: "УЗИ и базовые анализы", ok: true },
      { t: "Партнёрские роды", ok: false },
      { t: "Послеродовое наблюдение 1 мес.", ok: false },
    ],
    cta: "Начать",
  },
  {
    tier: "popular" as const,
    icon: <Sparkles size={18} />,
    name: "Премиум",
    desc: "Лучший выбор — полнота заботы и максимальный комфорт",
    month: 280000,
    year: 224000,
    features: [
      { t: "Ведение беременности (без лимита)", ok: true },
      { t: "Роды в комфортной палате", ok: true },
      { t: "Неонатолог 5 дней", ok: true },
      { t: "Полный спектр обследований", ok: true },
      { t: "Партнёрские роды", ok: true },
      { t: "Послеродовое наблюдение 3 мес.", ok: true },
    ],
    cta: "Выбрать Премиум",
  },
  {
    tier: "enterprise" as const,
    icon: <Award size={18} />,
    name: "VIP",
    desc: "Персональный уход на уровне премиального курорта",
    month: 450000,
    year: 360000,
    features: [
      { t: "Персональная акушерка", ok: true },
      { t: "Люкс-палата с гостиной", ok: true },
      { t: "Неонатолог 7 дней", ok: true },
      { t: "VIP-обследования и 4D УЗИ", ok: true },
      { t: "Партнёрские роды + гость", ok: true },
      { t: "Психолог + нутрициолог", ok: true },
    ],
    cta: "Связаться с нами",
  },
];

const FAQS = [
  {
    q: "Как попасть на первичную консультацию?",
    a: "Позвоните по +7 (495) 800-00-00 или оставьте заявку на сайте. Мы перезвоним в течение 30 минут и согласуем удобное время. Приём ежедневно с 8:00 до 20:00.",
  },
  {
    q: "На каком сроке лучше начать наблюдение?",
    a: "Рекомендуем обратиться на 6–8 неделе — в этот период фиксируется сердцебиение и мы начинаем персональный план. Но никогда не поздно: принимаем даже в третьем триместре.",
  },
  {
    q: "Можно ли присутствовать партнёру на родах?",
    a: "Да! Партнёрские роды доступны в тарифах Премиум и VIP. Предварительно проходим специальную подготовку — проводим курсы для будущих пап и поддерживающего человека.",
  },
  {
    q: "Какие документы нужны для оформления?",
    a: "Паспорт, полис ОМС или ДМС (при наличии), обменная карта. Если документов нет — первичная консультация проходит без них.",
  },
  {
    q: "Работаете ли вы со страховыми компаниями?",
    a: "Работаем с 40+ страховщиками: AlfaStrakhovanie, Sogaz, Ingosstrakh, ВСК и другими. Доступно оформление налогового вычета за медицинские услуги.",
  },
  {
    q: "Что включает послеродовый уход?",
    a: "Контрольные осмотры мамы и малыша, консультации по грудному вскармливанию, психологическая поддержка. В VIP-пакете — выезд специалиста на дом в первый месяц.",
  },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap');

.lp {
  --bg-base: #FAFAF9;
  --bg-surface: #FFFFFF;
  --text-primary: #0F0F0F;
  --text-secondary: #4B5563;
  --border: rgba(0,0,0,0.08);
  --shadow-lg: 0 20px 60px rgba(0,0,0,0.12);
  --accent: #EC4899;
  --accent-from: #EC4899;
  --accent-to: #F43F5E;
  --accent-light: rgba(236,72,153,0.1);
  --fd: 'Cormorant Garamond', Georgia, serif;
  --fb: 'Jost', system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--fb);
  overflow-x: hidden;
  min-height: 100vh;
}

.lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.lp ::selection { background: var(--accent); color: white; }
.lp ::-webkit-scrollbar { width: 5px; }
.lp ::-webkit-scrollbar-track { background: var(--bg-base); }
.lp ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }

.lp-c { max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 80px); }
.lp-s { padding: clamp(64px, 10vw, 140px) 0; }

/* Gradient text */
.lp-gt {
  background: linear-gradient(135deg, var(--accent-from), var(--accent-to));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Keyframes */
@keyframes lp-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes lp-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes lp-blob {
  0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25%      { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  50%      { border-radius: 50% 40% 60% 30% / 40% 60% 50% 70%; }
  75%      { border-radius: 40% 70% 30% 60% / 60% 40% 70% 30%; }
}
@keyframes lp-float {
  0%,100% { transform: translateY(0) rotate(0deg); }
  33%     { transform: translateY(-18px) rotate(2deg); }
  66%     { transform: translateY(-9px) rotate(-1deg); }
}
@keyframes lp-badge {
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.04); }
}
@keyframes lp-dot {
  0%,100% { opacity:1; transform:scale(1); }
  50%     { opacity:0.4; transform:scale(1.6); }
}
@keyframes lp-spin {
  from { transform: rotate(0deg); } to { transform: rotate(360deg); }
}
@keyframes lp-fadeInUp {
  from { opacity:0; transform:translateY(32px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lp-word-out {
  from { opacity:1; transform:translateY(0); }
  to   { opacity:0; transform:translateY(-12px); }
}
@keyframes lp-word-in {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}

.lp-word-out { animation: lp-word-out 0.35s ease forwards; }
.lp-word-in  { animation: lp-word-in  0.35s ease forwards; }

/* Reveal on scroll */
.lp-ob {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1),
              transform 0.7s cubic-bezier(0.16,1,0.3,1);
}
.lp-ob.lp-vis { opacity: 1; transform: translateY(0); }

/* ── Navbar ── */
.lp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  padding: 20px 0;
  transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
}
.lp-nav.lp-sc {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 4px 24px rgba(0,0,0,0.05);
  padding: 12px 0;
}
.lp-nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.lp-logo {
  font-family: var(--fd); font-size: 26px; font-weight: 600;
  color: var(--text-primary); text-decoration: none; letter-spacing: -0.5px;
  flex-shrink: 0;
}
.lp-logo em {
  font-style: normal;
  background: linear-gradient(135deg, var(--accent-from), var(--accent-to));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.lp-nav-links {
  display: flex; gap: 32px; list-style: none;
}
.lp-nav-links a {
  font-size: 14px; font-weight: 500; color: var(--text-secondary);
  text-decoration: none; transition: color 0.3s; letter-spacing: 0.2px;
}
.lp-nav-links a:hover { color: var(--accent); }
.lp-nav-r { display: flex; align-items: center; gap: 10px; }

/* Buttons */
.lp-btn {
  position: relative; display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 26px; border-radius: 100px;
  font-family: var(--fb); font-size: 14px; font-weight: 600;
  cursor: pointer; text-decoration: none; transition: transform 0.3s, box-shadow 0.3s;
  overflow: hidden; border: none; white-space: nowrap; letter-spacing: 0.2px;
}
.lp-btn-p {
  background: linear-gradient(135deg, var(--accent-from), var(--accent-to));
  color: white; box-shadow: 0 4px 24px rgba(236,72,153,0.35);
}
.lp-btn-p::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28) 50%, transparent);
  background-size: 200% 100%;
  animation: lp-shimmer 2.5s linear infinite;
}
.lp-btn-p:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(236,72,153,0.5); }
.lp-btn-s {
  background: transparent; color: var(--text-primary);
  border: 1.5px solid rgba(0,0,0,0.14);
}
.lp-btn-s:hover { background: var(--text-primary); color: white; border-color: var(--text-primary); }
.lp-btn-lg { padding: 16px 34px; font-size: 16px; }
.lp-btn-blk {
  background: white; color: var(--accent);
  box-shadow: none; display: flex; align-items: center; gap: 6px;
}
.lp-btn-blk:hover { background: rgba(255,255,255,0.92); transform: scale(1.02); }

/* Mobile */
.lp-burger { display: none; background: none; border: none; cursor: pointer; padding: 8px; color: var(--text-primary); }
.lp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 998; opacity: 0; pointer-events: none; transition: opacity 0.35s; }
.lp-overlay.lp-open { opacity: 1; pointer-events: all; }
.lp-drawer {
  position: fixed; top: 0; right: 0; width: min(320px,92vw); height: 100dvh;
  background: white; z-index: 999;
  padding: 88px 32px 40px;
  display: flex; flex-direction: column; gap: 6px;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
}
.lp-drawer.lp-open { transform: translateX(0); }
.lp-drawer-x { position: absolute; top: 24px; right: 24px; background: none; border: none; cursor: pointer; color: var(--text-secondary); }
.lp-drawer a.lp-dlink {
  font-size: 18px; font-weight: 500; color: var(--text-primary); text-decoration: none;
  padding: 13px 0; border-bottom: 1px solid var(--border); display: block;
}

/* ── Hero ── */
.lp-hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; }
.lp-hero-bg {
  position: absolute; inset: 0;
  background: url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=90') center/cover no-repeat;
  will-change: transform;
}
.lp-hero-ov {
  position: absolute; inset: 0;
  background: linear-gradient(130deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 55%, rgba(255,255,255,0.65) 100%);
}
.lp-blob {
  position: absolute; right: -8%; top: 5%;
  width: clamp(300px,50vw,680px); height: clamp(300px,50vw,680px);
  background: linear-gradient(135deg, rgba(236,72,153,0.14), rgba(244,63,94,0.08));
  animation: lp-blob 8s ease-in-out infinite, lp-float 14s ease-in-out infinite;
  pointer-events: none;
}
.lp-hero-c { position: relative; z-index: 2; padding-top: 110px; padding-bottom: 80px; }
.lp-badge-pill {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 8px 18px; border-radius: 100px;
  background: rgba(236,72,153,0.08); border: 1px solid rgba(236,72,153,0.2);
  font-size: 13px; font-weight: 500; color: var(--accent); margin-bottom: 28px;
  animation: lp-badge 2s ease-in-out infinite; letter-spacing: 0.2px;
}
.lp-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: lp-dot 2s ease-in-out infinite; }
.lp-h1 {
  font-family: var(--fd);
  font-size: clamp(38px, 8vw, 96px);
  font-weight: 600; line-height: 1.04; letter-spacing: -2.5px;
  margin-bottom: 24px; color: var(--text-primary);
}
.lp-sub {
  font-size: clamp(16px, 2vw, 20px); color: var(--text-secondary);
  line-height: 1.7; max-width: 560px; margin-bottom: 40px;
}
.lp-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 48px; }
.lp-sp { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.lp-avs { display: flex; }
.lp-av { width: 40px; height: 40px; border-radius: 50%; border: 2.5px solid white; object-fit: cover; margin-left: -8px; }
.lp-av:first-child { margin-left: 0; }
.lp-stars { display: flex; gap: 2px; margin-bottom: 3px; }
.lp-sp-text { font-size: 14px; color: var(--text-secondary); }

/* ── Logos ── */
.lp-logos { padding: 40px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: white; overflow: hidden; }
.lp-logos-lbl { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--text-secondary); opacity: 0.45; text-align: center; margin-bottom: 24px; }
.lp-mq-wrap { overflow: hidden; }
.lp-mq { display: flex; gap: 60px; width: max-content; animation: lp-marquee 24s linear infinite; }
.lp-mq:hover { animation-play-state: paused; }
.lp-mq-item {
  font-family: var(--fd); font-size: 21px; font-weight: 600;
  color: var(--text-secondary); opacity: 0.35; white-space: nowrap;
  transition: all 0.3s; cursor: default; letter-spacing: -0.5px;
}
.lp-mq-item:hover { opacity: 1; transform: scale(1.05); color: var(--accent); }

/* ── Section label ── */
.lp-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 100px;
  background: var(--accent-light); font-size: 11px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent);
  margin-bottom: 18px;
}
.lp-st {
  font-family: var(--fd);
  font-size: clamp(28px, 5vw, 54px);
  font-weight: 600; line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 16px;
}
.lp-ss { font-size: 18px; color: var(--text-secondary); line-height: 1.7; max-width: 560px; }

/* ── Features ── */
.lp-fg { display: grid; gap: 20px; }
.lp-fr1 { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; }
.lp-fr2 { display: grid; grid-template-columns: 2fr 3fr; gap: 20px; }
.lp-fc {
  background: white; border: 1px solid var(--border); border-radius: 24px; padding: 40px;
  transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.5s, border-color 0.5s;
}
.lp-fc:hover {
  transform: translateY(-6px) scale(1.015);
  box-shadow: 0 20px 60px rgba(236,72,153,0.13);
  border-color: rgba(236,72,153,0.28);
}
.lp-fi { width: 52px; height: 52px; background: linear-gradient(135deg,var(--accent-from),var(--accent-to)); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 22px; }
.lp-ft { font-family: var(--fd); font-size: 26px; font-weight: 600; margin-bottom: 11px; letter-spacing: -0.5px; }
.lp-fd { font-size: 15px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 18px; }
.lp-fl { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: var(--accent); text-decoration: none; position: relative; }
.lp-fl::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:1px; background:var(--accent); transition:width 0.3s; }
.lp-fl:hover::after { width:100%; }
.lp-fc-cols { display: flex; flex-direction: column; gap: 20px; }

/* ── Stats ── */
.lp-stats { background: linear-gradient(135deg,#18000d 0%,#2a0e1c 60%,#18000d 100%); position: relative; overflow: hidden; }
.lp-stats::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 30% 50%,rgba(236,72,153,0.12),transparent 60%); }
.lp-sg { display: grid; grid-template-columns: repeat(4,1fr); position: relative; z-index: 1; }
.lp-si { padding: 64px 32px; text-align: center; border-right: 1px solid rgba(255,255,255,0.07); }
.lp-si:last-child { border-right: none; }
.lp-sn {
  font-family: var(--fd); font-size: clamp(48px,6vw,72px); font-weight: 700;
  line-height: 1; letter-spacing: -3px;
  background: linear-gradient(135deg,var(--accent-from),var(--accent-to));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 8px;
}
.lp-sl { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.38); margin-bottom: 12px; }
.lp-str { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #4ade80; background: rgba(74,222,128,0.1); padding: 4px 10px; border-radius: 100px; }

/* ── How it works ── */
.lp-hw { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; align-items: start; gap: 0; }
.lp-hwc { padding-top: 52px; display: flex; align-items: center; justify-content: center; }
.lp-dash { width: 72px; height: 2px; background: linear-gradient(90deg,var(--accent-from),var(--accent-to)); opacity: 0.28; border-radius: 2px; }
.lp-step { text-align: center; padding: 0 16px; }
.lp-sbadge {
  width: 62px; height: 62px;
  background: linear-gradient(135deg,var(--accent-from),var(--accent-to));
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
  font-family: var(--fd); font-size: 24px; font-weight: 700; color: white;
  box-shadow: 0 8px 32px rgba(236,72,153,0.35);
}
.lp-sico { display: flex; justify-content: center; margin-bottom: 14px; }
.lp-stit { font-family: var(--fd); font-size: 24px; font-weight: 600; margin-bottom: 12px; letter-spacing: -0.5px; }
.lp-sdesc { font-size: 15px; color: var(--text-secondary); line-height: 1.7; }

/* ── Testimonials ── */
.lp-tg { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
.lp-tc { background: white; border: 1px solid var(--border); border-radius: 24px; padding: 40px; transition: transform 0.4s, box-shadow 0.4s; }
.lp-tc:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.lp-tc.lp-tf { background: linear-gradient(135deg,var(--accent-from),var(--accent-to)); border: none; }
.lp-qq { font-family: var(--fd); font-size: 72px; line-height: 0.7; color: var(--accent); opacity: 0.2; display: block; margin-bottom: 14px; }
.lp-tc.lp-tf .lp-qq { color: white; opacity: 0.22; }
.lp-tx { font-family: var(--fd); font-size: 17px; line-height: 1.7; color: var(--text-secondary); font-style: italic; margin-bottom: 24px; }
.lp-tc.lp-tf .lp-tx { color: rgba(255,255,255,0.92); }
.lp-ta { display: flex; align-items: center; gap: 12px; }
.lp-tav { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent); flex-shrink: 0; }
.lp-tc.lp-tf .lp-tav { border-color: rgba(255,255,255,0.45); }
.lp-tname { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.lp-tc.lp-tf .lp-tname { color: white; }
.lp-trole { font-size: 13px; color: var(--text-secondary); opacity: 0.65; }
.lp-tc.lp-tf .lp-trole { color: rgba(255,255,255,0.62); }
.lp-tdate { font-size: 12px; color: var(--text-secondary); opacity: 0.4; margin-top: 3px; }
.lp-tc.lp-tf .lp-tdate { color: rgba(255,255,255,0.38); }

/* ── Pricing ── */
.lp-ph { text-align: center; margin-bottom: 40px; }
.lp-tog-w { display: flex; justify-content: center; margin-bottom: 52px; }
.lp-tog { display: inline-flex; background: white; border: 1px solid var(--border); border-radius: 100px; padding: 4px; gap: 4px; }
.lp-togb {
  padding: 10px 22px; border-radius: 100px; font-size: 14px; font-weight: 500;
  cursor: pointer; border: none; background: transparent; font-family: var(--fb);
  color: var(--text-secondary); display: flex; align-items: center; gap: 8px; transition: all 0.3s;
}
.lp-togb.lp-ta { background: linear-gradient(135deg,var(--accent-from),var(--accent-to)); color: white; box-shadow: 0 4px 16px rgba(236,72,153,0.3); }
.lp-disc { background: rgba(236,72,153,0.1); color: var(--accent); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 100px; }
.lp-togb.lp-ta .lp-disc { background: rgba(255,255,255,0.2); color: white; }
.lp-pg { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; align-items: center; }
.lp-pc { background: white; border: 1px solid var(--border); border-radius: 24px; padding: 40px; transition: box-shadow 0.4s; }
.lp-pc.lp-pp {
  transform: scale(1.05) translateY(-12px);
  position: relative; border: 2px solid transparent;
  box-shadow: 0 20px 60px rgba(236,72,153,0.22);
}
.lp-pc.lp-pp::before {
  content:''; position:absolute; inset:-2px; border-radius:25px; z-index:-1;
  background: linear-gradient(135deg,var(--accent-from),var(--accent-to));
}
.lp-pc.lp-pe { background: #0F0F0F; border-color: transparent; }
.lp-pbadge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 18px; }
.lp-pb-b { background: var(--accent-light); color: var(--accent); }
.lp-pb-p { background: linear-gradient(135deg,var(--accent-from),var(--accent-to)); color: white; }
.lp-pb-e { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.lp-pname { font-family: var(--fd); font-size: 30px; font-weight: 600; margin-bottom: 8px; letter-spacing: -0.5px; }
.lp-pc.lp-pe .lp-pname { color: white; }
.lp-pdesc { font-size: 14px; color: var(--text-secondary); margin-bottom: 26px; line-height: 1.5; }
.lp-pc.lp-pe .lp-pdesc { color: rgba(255,255,255,0.5); }
.lp-prc { font-family: var(--fd); font-size: 54px; font-weight: 700; line-height: 1; letter-spacing: -2px; margin-bottom: 4px; }
.lp-pc.lp-pe .lp-prc { color: white; }
.lp-prn { font-size: 13px; color: var(--text-secondary); margin-bottom: 28px; }
.lp-pc.lp-pe .lp-prn { color: rgba(255,255,255,0.38); }
.lp-fl2 { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px; }
.lp-fi2 { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-secondary); }
.lp-pc.lp-pe .lp-fi2 { color: rgba(255,255,255,0.62); }
.lp-ck { width: 20px; height: 20px; background: linear-gradient(135deg,var(--accent-from),var(--accent-to)); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lp-fi2.lp-no .lp-ck { background: rgba(0,0,0,0.08); }
.lp-fi2.lp-no span { opacity: 0.38; text-decoration: line-through; }
.lp-pc.lp-pe .lp-fi2.lp-no .lp-ck { background: rgba(255,255,255,0.1); }

/* ── FAQ ── */
.lp-fq-g { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.lp-fq { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; transition: border-color 0.3s; }
.lp-fq.lp-fopen { border-color: rgba(236,72,153,0.24); background: rgba(236,72,153,0.02); }
.lp-fqb {
  width: 100%; padding: 22px 24px; background: transparent; border: none;
  font-family: var(--fb); font-size: 15px; font-weight: 600; color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 14px;
  text-align: left; line-height: 1.4;
}
.lp-fchv { flex-shrink: 0; color: var(--accent); transition: transform 0.4s; }
.lp-fq.lp-fopen .lp-fchv { transform: rotate(180deg); }
.lp-fqa { max-height: 0; overflow: hidden; transition: max-height 0.42s ease; font-size: 15px; color: var(--text-secondary); line-height: 1.7; }
.lp-fq.lp-fopen .lp-fqa { max-height: 280px; }
.lp-fqi { padding: 0 24px 20px; }

/* ── CTA Banner ── */
.lp-cta { position: relative; overflow: hidden; padding: clamp(80px,12vw,160px) 0; text-align: center; }
.lp-cta-bg {
  position: absolute; inset: 0;
  background: #0a0008;
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(236,72,153,0.4) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 50%, rgba(244,63,94,0.28) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 5%,  rgba(236,72,153,0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 95%, rgba(244,63,94,0.15) 0%, transparent 50%);
}
.lp-cta-c { position: relative; z-index: 1; }
.lp-cta-t { font-family: var(--fd); font-size: clamp(34px,5vw,62px); font-weight: 600; color: white; line-height: 1.1; letter-spacing: -2px; margin-bottom: 16px; }
.lp-cta-s { font-size: 18px; color: rgba(255,255,255,0.6); max-width: 460px; margin: 0 auto 36px; line-height: 1.6; }
.lp-ef {
  display: flex; max-width: 450px;
  background: rgba(255,255,255,0.07); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 100px;
  padding: 5px; margin: 0 auto 14px;
}
.lp-ei {
  flex: 1; background: transparent; border: none; outline: none;
  padding: 12px 20px; font-family: var(--fb); font-size: 15px; color: white; min-width: 0;
}
.lp-ei::placeholder { color: rgba(255,255,255,0.42); }
.lp-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: lp-spin 0.8s linear infinite; }
.lp-disc2 { font-size: 12px; color: rgba(255,255,255,0.33); }

/* ── Footer ── */
.lp-ft { background: #08000a; color: rgba(255,255,255,0.58); padding: 80px 0 0; }
.lp-fg2 { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 56px; padding-bottom: 56px; border-bottom: 1px solid rgba(255,255,255,0.07); }
.lp-fbrand { font-family: var(--fd); font-size: 28px; font-weight: 600; color: white; margin-bottom: 13px; }
.lp-fdesc { font-size: 14px; line-height: 1.7; margin-bottom: 22px; }
.lp-socl { display: flex; gap: 10px; }
.lp-sl2 { width: 38px; height: 38px; background: rgba(255,255,255,0.06); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.52); text-decoration: none; transition: all 0.3s; }
.lp-sl2:hover { background: var(--accent); color: white; transform: translateY(-2px); }
.lp-fh { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(255,255,255,0.22); margin-bottom: 18px; }
.lp-flnks { list-style: none; display: flex; flex-direction: column; gap: 11px; }
.lp-flnks a { font-size: 14px; color: rgba(255,255,255,0.52); text-decoration: none; transition: color 0.3s; }
.lp-flnks a:hover { color: var(--accent); }
.lp-fbt { display: flex; justify-content: space-between; align-items: center; padding: 22px 0; font-size: 13px; gap: 16px; flex-wrap: wrap; }
.lp-fbt-l { display: flex; gap: 22px; }
.lp-fbt-l a { color: rgba(255,255,255,0.38); text-decoration: none; font-size: 13px; transition: color 0.3s; }
.lp-fbt-l a:hover { color: var(--accent); }
.lp-fcontact { display: flex; flex-direction: column; gap: 8px; margin-top: 22px; }
.lp-fci { display: flex; align-items: center; gap: 8px; font-size: 13px; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .lp-fr1, .lp-fr2 { grid-template-columns: 1fr; }
  .lp-pg { grid-template-columns: 1fr; }
  .lp-pc.lp-pp { transform: none; }
  .lp-pc.lp-pp::before { display: none; }
  .lp-pc.lp-pp { border: 2px solid var(--accent); }
}
@media (max-width: 768px) {
  .lp-nav-links { display: none; }
  .lp-nav-cta { display: none; }
  .lp-burger { display: flex; }
  .lp-h1 { letter-spacing: -1.2px; }
  .lp-sg { grid-template-columns: 1fr 1fr; }
  .lp-si { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07); padding: 40px 20px; }
  .lp-si:nth-child(3), .lp-si:last-child { border-bottom: none; }
  .lp-hw { grid-template-columns: 1fr; }
  .lp-hwc { display: none; }
  .lp-tg { display: flex; overflow-x: auto; gap: 16px; padding-bottom: 16px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
  .lp-tc { min-width: 280px; scroll-snap-align: start; }
  .lp-fq-g { grid-template-columns: 1fr; }
  .lp-fg2 { grid-template-columns: 1fr 1fr; gap: 36px; }
}
@media (max-width: 480px) {
  .lp-fg2 { grid-template-columns: 1fr; }
  .lp-ef { flex-direction: column; border-radius: 18px; }
  .lp-btn.lp-btn-blk { border-radius: 13px; justify-content: center; }
  .lp-sn { font-size: 44px; letter-spacing: -2px; }
}
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [pricingPlan, setPricingPlan] = useState<"month" | "year">("month");
  const [openFAQ, setOpenFAQ]         = useState<number | null>(null);
  const [wordIdx, setWordIdx]         = useState(0);
  const [wordAnim, setWordAnim]       = useState<"in" | "out">("in");
  const [statsOn, setStatsOn]         = useState(false);
  const [counts, setCounts]           = useState({ a: 0, b: 0, c: 0, d: 0 });
  const [loading, setLoading]         = useState(false);
  const [sent, setSent]               = useState(false);

  const heroBgRef = useRef<HTMLDivElement>(null);
  const statsRef  = useRef<HTMLDivElement>(null);
  const obsRef    = useRef<IntersectionObserver | null>(null);

  // Navbar scroll + hero parallax
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      if (heroBgRef.current) {
        heroBgRef.current.style.transform = `translateY(${window.scrollY * 0.28}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Typing word cycle
  useEffect(() => {
    const id = setInterval(() => {
      setWordAnim("out");
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % TYPING_WORDS.length);
        setWordAnim("in");
      }, 360);
    }, 3400);
    return () => clearInterval(id);
  }, []);

  // IntersectionObserver for reveal
  useEffect(() => {
    obsRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("lp-vis");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    const els = document.querySelectorAll(".lp-ob");
    els.forEach((el) => obsRef.current?.observe(el));
    return () => obsRef.current?.disconnect();
  }, []);

  // Stats visibility
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStatsOn(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  // Counter animation
  useEffect(() => {
    if (!statsOn) return;
    const targets = [8500, 15, 98, 60];
    const dur = 2200;
    const t0 = performance.now();
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const frame = (now: number) => {
      const prog = Math.min((now - t0) / dur, 1);
      const e = ease(prog);
      const r = (n: number) => Math.round(e * n);
      setCounts({ a: r(targets[0]), b: r(targets[1]), c: r(targets[2]), d: r(targets[3]) });
      if (prog < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [statsOn]);

  const handleEmail = (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 2200);
  };

  const navLinks = [
    ["#features", "Услуги"],
    ["#how", "Как работает"],
    ["#pricing", "Цены"],
    ["#faq", "FAQ"],
    ["#footer", "Контакты"],
  ] as const;

  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className={`lp-nav ${scrolled ? "lp-sc" : ""}`}>
        <div className="lp-c">
          <div className="lp-nav-inner">
            <a href="#hero" className="lp-logo">Mater<em>Care</em></a>

            <ul className="lp-nav-links">
              {navLinks.map(([href, label]) => (
                <li key={href}><a href={href}>{label}</a></li>
              ))}
            </ul>

            <div className="lp-nav-r">
              <a href="#pricing" className="lp-btn lp-btn-p lp-nav-cta" aria-label="Записаться на консультацию">
                <Phone size={14} /> Записаться
              </a>
              <button className="lp-burger" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`lp-overlay ${menuOpen ? "lp-open" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`lp-drawer ${menuOpen ? "lp-open" : ""}`} role="dialog" aria-modal="true" aria-label="Навигация">
        <button className="lp-drawer-x" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">
          <X size={22} />
        </button>
        {navLinks.map(([href, label]) => (
          <a key={href} href={href} className="lp-dlink" onClick={() => setMenuOpen(false)}>{label}</a>
        ))}
        <a
          href="#pricing"
          className="lp-btn lp-btn-p"
          style={{ marginTop: 20, justifyContent: "center" }}
          onClick={() => setMenuOpen(false)}
        >
          Записаться на консультацию
        </a>
      </div>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-bg" ref={heroBgRef} aria-hidden="true" />
        <div className="lp-hero-ov" aria-hidden="true" />
        <div className="lp-blob" aria-hidden="true" />

        <div className="lp-c lp-hero-c">
          <div style={{ maxWidth: 720 }}>
            <div className="lp-badge-pill">
              <span className="lp-dot" aria-hidden="true" />
              Премиальный перинатальный центр · Москва
            </div>

            <h1 className="lp-h1">
              Лучшее начало<br />
              для{" "}
              <span
                key={wordIdx}
                className={`lp-gt ${wordAnim === "out" ? "lp-word-out" : "lp-word-in"}`}
                style={{ display: "inline-block" }}
              >
                {TYPING_WORDS[wordIdx]}
              </span>
            </h1>

            <p className="lp-sub">
              MaterCare — клиника, где каждый момент материнства окружён заботой,
              профессионализмом и теплом. Ведём беременность и роды по международным стандартам.
            </p>

            <div className="lp-actions">
              <a href="#pricing" className="lp-btn lp-btn-p lp-btn-lg">
                <Sparkles size={18} aria-hidden="true" />
                Записаться на консультацию
              </a>
              <a href="#how" className="lp-btn lp-btn-s lp-btn-lg">
                Как это работает
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>

            <div className="lp-sp">
              <div className="lp-avs">
                {AVATAR_IDS.map((id, i) => (
                  <img
                    key={id}
                    src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=80&q=80`}
                    alt={`Клиентка MaterCare ${i + 1}`}
                    className="lp-av"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
              <div>
                <div className="lp-stars" aria-label="Оценка: 5 звёзд">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="#EC4899" color="#EC4899" aria-hidden="true" />
                  ))}
                </div>
                <p className="lp-sp-text">
                  <strong style={{ color: "#0F0F0F" }}>4 200+ семей</strong> доверяют нам
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos bar ──────────────────────────────────────────── */}
      <div className="lp-logos">
        <p className="lp-logos-lbl">Нам доверяют</p>
        <div className="lp-mq-wrap" aria-hidden="true">
          <div className="lp-mq">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <span key={i} className="lp-mq-item">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="lp-s" id="features" style={{ background: "var(--bg-base)" }}>
        <div className="lp-c">
          <div className="lp-ob" style={{ marginBottom: 56 }}>
            <span className="lp-tag"><Heart size={11} aria-hidden="true" /> Наши услуги</span>
            <h2 className="lp-st">Всё, что нужно для<br />счастливого материнства</h2>
            <p className="lp-ss">Более 15 лет мы создаём среду, где рождение ребёнка — радость, а не стресс.</p>
          </div>

          <div className="lp-fg">
            {/* Row 1 — large | small+small */}
            <div className="lp-fr1">
              <div className="lp-fc lp-ob">
                <div className="lp-fi" aria-hidden="true"><Heart size={22} color="white" /></div>
                <h3 className="lp-ft">Индивидуальный уход</h3>
                <p className="lp-fd">Каждая беременность уникальна. Персональный план ведения составляется с первой консультации, учитывая все особенности вашего здоровья и пожелания семьи.</p>
                <a href="#pricing" className="lp-fl">→ Подробнее</a>
              </div>
              <div className="lp-fc-cols">
                <div className="lp-fc lp-ob" style={{ transitionDelay: "80ms" }}>
                  <div className="lp-fi" aria-hidden="true"><Users size={22} color="white" /></div>
                  <h3 className="lp-ft">Команда экспертов</h3>
                  <p className="lp-fd">Акушеры и неонатологи высшей категории с международными сертификатами и опытом от 15 лет.</p>
                  <a href="#how" className="lp-fl">→ Наша команда</a>
                </div>
                <div className="lp-fc lp-ob" style={{ transitionDelay: "160ms" }}>
                  <div className="lp-fi" aria-hidden="true"><Shield size={22} color="white" /></div>
                  <h3 className="lp-ft">Современное оборудование</h3>
                  <p className="lp-fd">4D УЗИ, КТГ-мониторинг, операционные класса А — безопасность на каждом этапе.</p>
                  <a href="#features" className="lp-fl">→ Оснащение</a>
                </div>
              </div>
            </div>

            {/* Row 2 — small+small | large */}
            <div className="lp-fr2">
              <div className="lp-fc-cols">
                <div className="lp-fc lp-ob" style={{ transitionDelay: "80ms" }}>
                  <div className="lp-fi" aria-hidden="true"><Clock size={22} color="white" /></div>
                  <h3 className="lp-ft">Поддержка 24/7</h3>
                  <p className="lp-fd">Горячая линия и дежурный врач круглосуточно — вы не останетесь одна с тревогой.</p>
                  <a href="#faq" className="lp-fl">→ FAQ</a>
                </div>
                <div className="lp-fc lp-ob" style={{ transitionDelay: "160ms" }}>
                  <div className="lp-fi" aria-hidden="true"><Sparkles size={22} color="white" /></div>
                  <h3 className="lp-ft">Психологическая поддержка</h3>
                  <p className="lp-fd">Перинатальные психологи — от тревог беременности до послеродовой адаптации.</p>
                  <a href="#pricing" className="lp-fl">→ VIP-программа</a>
                </div>
              </div>
              <div className="lp-fc lp-ob">
                <div className="lp-fi" aria-hidden="true"><Award size={22} color="white" /></div>
                <h3 className="lp-ft">Комфортные палаты</h3>
                <p className="lp-fd">Номера гостиничного класса для мамы, малыша и партнёра. Отдельный санузел, умный TV, меню ресторанного уровня. Партнёрские роды — с первого взгляда на малыша.</p>
                <a href="#pricing" className="lp-fl">→ Посмотреть палаты</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="lp-stats lp-s" ref={statsRef}>
        <div className="lp-c">
          <div className="lp-sg">
            {[
              { v: counts.a.toLocaleString("ru-RU"), suf: "+", lbl: "Успешных родов",  tr: "↑ +12% за год" },
              { v: counts.b,                          suf: " лет", lbl: "На рынке",       tr: "↑ Топ-5 Москвы" },
              { v: counts.c,                          suf: "%",  lbl: "Довольных семей", tr: "↑ Выше нормы" },
              { v: counts.d,                          suf: "+",  lbl: "Специалистов",    tr: "↑ Растём" },
            ].map((s, i) => (
              <div key={i} className="lp-si">
                <div className="lp-sn" aria-label={`${s.v}${s.suf} ${s.lbl}`}>
                  {s.v}{s.suf}
                </div>
                <div className="lp-sl">{s.lbl}</div>
                <div className="lp-str">
                  <TrendingUp size={11} aria-hidden="true" /> {s.tr}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="lp-s" id="how" style={{ background: "var(--bg-surface)" }}>
        <div className="lp-c">
          <div className="lp-ob" style={{ textAlign: "center", marginBottom: 60 }}>
            <span className="lp-tag"><CalendarCheck size={11} aria-hidden="true" /> Как это работает</span>
            <h2 className="lp-st">Три шага к безопасным родам</h2>
            <p className="lp-ss" style={{ margin: "0 auto" }}>
              Простой и понятный процесс — от первого звонка до выписки из клиники
            </p>
          </div>

          <div className="lp-hw">
            {STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <div className="lp-step lp-ob" style={{ transitionDelay: `${i * 150}ms` }}>
                  <div className="lp-sbadge" aria-hidden="true">{step.num}</div>
                  <div className="lp-sico" aria-hidden="true">{step.icon}</div>
                  <h3 className="lp-stit">{step.title}</h3>
                  <p className="lp-sdesc">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="lp-hwc" aria-hidden="true">
                    <div className="lp-dash" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section className="lp-s" id="reviews" style={{ background: "var(--bg-base)" }}>
        <div className="lp-c">
          <div className="lp-ob" style={{ marginBottom: 48 }}>
            <span className="lp-tag"><Star size={11} aria-hidden="true" /> Отзывы</span>
            <h2 className="lp-st">Что говорят наши семьи</h2>
          </div>

          <div className="lp-tg">
            {TESTIMONIALS.map((t, i) => (
              <article
                key={i}
                className={`lp-tc lp-ob ${t.featured ? "lp-tf" : ""}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="lp-qq" aria-hidden="true">"</span>
                <div className="lp-stars" aria-label="5 из 5 звёзд">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j} size={14}
                      fill={t.featured ? "rgba(255,255,255,0.9)" : "#EC4899"}
                      color="transparent"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="lp-tx">«{t.text}»</p>
                <div className="lp-ta">
                  <img
                    src={`https://images.unsplash.com/photo-${t.avatar}?auto=format&fit=crop&w=112&q=80`}
                    alt={`Фото ${t.name}`}
                    className="lp-tav"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <div className="lp-tname">{t.name}</div>
                    <div className="lp-trole">{t.role}</div>
                    <div className="lp-tdate">{t.date}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section className="lp-s" id="pricing" style={{ background: "var(--bg-surface)" }}>
        <div className="lp-c">
          <div className="lp-ph lp-ob">
            <span className="lp-tag"><Sparkles size={11} aria-hidden="true" /> Тарифы</span>
            <h2 className="lp-st">Выберите программу</h2>
            <p className="lp-ss" style={{ margin: "0 auto" }}>
              Прозрачные цены без скрытых доплат. Все тарифы включают акушерское сопровождение.
            </p>
          </div>

          <div className="lp-tog-w">
            <div className="lp-tog" role="group" aria-label="Вид тарифа">
              <button
                className={`lp-togb ${pricingPlan === "month" ? "lp-ta" : ""}`}
                onClick={() => setPricingPlan("month")}
                aria-pressed={pricingPlan === "month"}
              >
                Помесячно
              </button>
              <button
                className={`lp-togb ${pricingPlan === "year" ? "lp-ta" : ""}`}
                onClick={() => setPricingPlan("year")}
                aria-pressed={pricingPlan === "year"}
              >
                Полный пакет
                <span className="lp-disc">–20%</span>
              </button>
            </div>
          </div>

          <div className="lp-pg">
            {PLANS.map((plan, i) => (
              <div
                key={plan.tier}
                className={`lp-pc lp-ob ${plan.tier === "popular" ? "lp-pp" : ""} ${plan.tier === "enterprise" ? "lp-pe" : ""}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={`lp-pbadge lp-pb-${plan.tier === "popular" ? "p" : plan.tier === "enterprise" ? "e" : "b"}`}>
                  <span aria-hidden="true">{plan.icon}</span> {plan.name}
                  {plan.tier === "popular" && " ✦"}
                </div>
                <div className="lp-pname">{plan.name}</div>
                <p className="lp-pdesc">{plan.desc}</p>
                <div className="lp-prc">
                  {(pricingPlan === "month" ? plan.month : plan.year).toLocaleString("ru-RU")} ₽
                </div>
                <div className="lp-prn">
                  {pricingPlan === "year" ? "Полный пакет · экономия 20%" : "Базовая стоимость"}
                </div>
                <ul className="lp-fl2" aria-label={`Что входит в тариф ${plan.name}`}>
                  {plan.features.map((f, fi) => (
                    <li key={fi} className={`lp-fi2 ${!f.ok ? "lp-no" : ""}`}>
                      <div className="lp-ck" aria-hidden="true">
                        <Check size={11} color={f.ok ? "white" : "rgba(0,0,0,0.25)"} strokeWidth={3} />
                      </div>
                      <span>{f.t}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#cta"
                  className={`lp-btn ${plan.tier === "popular" ? "lp-btn-p" : "lp-btn-s"}`}
                  style={{ width: "100%", justifyContent: "center", display: "flex" }}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="lp-s" id="faq" style={{ background: "var(--bg-base)" }}>
        <div className="lp-c">
          <div className="lp-ob" style={{ marginBottom: 48 }}>
            <span className="lp-tag">Вопросы и ответы</span>
            <h2 className="lp-st">Часто задаваемые вопросы</h2>
          </div>

          <div className="lp-fq-g">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`lp-fq lp-ob ${openFAQ === i ? "lp-fopen" : ""}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <button
                  className="lp-fqb"
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  aria-expanded={openFAQ === i}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="lp-fchv" aria-hidden="true" />
                </button>
                <div className="lp-fqa" aria-hidden={openFAQ !== i}>
                  <div className="lp-fqi">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="lp-cta" id="cta" aria-labelledby="cta-title">
        <div className="lp-cta-bg" aria-hidden="true" />
        <div className="lp-cta-c lp-c">
          <div className="lp-ob">
            <h2 className="lp-cta-t" id="cta-title">
              Готовы начать<br />этот путь вместе?
            </h2>
            <p className="lp-cta-s">
              Оставьте email — пришлём подробный гид по ведению беременности и запишем на первичную консультацию.
            </p>

            <form className="lp-ef" onSubmit={handleEmail} noValidate>
              <input
                type="email"
                className="lp-ei"
                placeholder="ваш@email.ru"
                required
                aria-label="Email адрес"
                disabled={sent}
              />
              <button type="submit" className="lp-btn lp-btn-blk" disabled={loading || sent} aria-label="Отправить форму">
                {loading ? (
                  <span className="lp-spin" aria-label="Загрузка" />
                ) : sent ? (
                  <><Check size={15} aria-hidden="true" /> Отправлено!</>
                ) : (
                  <><ArrowRight size={15} aria-hidden="true" /> Получить гид</>
                )}
              </button>
            </form>

            <p className="lp-disc2">🔒 Без спама. Отписка в один клик. Ваши данные защищены.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="lp-ft" id="footer">
        <div className="lp-c">
          <div className="lp-fg2">
            {/* Brand */}
            <div>
              <div className="lp-fbrand">
                Mater
                <span style={{ background: "linear-gradient(135deg,#EC4899,#F43F5E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Care
                </span>
              </div>
              <p className="lp-fdesc">Премиальная клиника материнства и родовспоможения в Москве. Заботимся о маме и малыше с 2009 года.</p>
              <div className="lp-socl">
                {[
                  { Icon: Instagram, label: "Instagram" },
                  { Icon: Facebook, label: "Facebook" },
                  { Icon: Youtube, label: "YouTube" },
                  { Icon: Phone, label: "Позвонить нам" },
                ].map(({ Icon, label }) => (
                  <a key={label} href="#" aria-label={label} className="lp-sl2">
                    <Icon size={16} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {/* Columns */}
            {[
              { head: "Продукт", links: ["Ведение беременности", "Родовспоможение", "Послеродовой уход", "Неонатология", "Психология"] },
              { head: "Компания", links: ["О нас", "Команда врачей", "Лицензии", "Пресс-центр", "Вакансии"] },
              { head: "Поддержка", links: ["FAQ", "Контакты", "Записаться", "Страховым", "Политика конф."] },
            ].map(({ head, links }) => (
              <div key={head}>
                <div className="lp-fh">{head}</div>
                <ul className="lp-flnks">
                  {links.map((l) => <li key={l}><a href="#">{l}</a></li>)}
                </ul>
                {head === "Поддержка" && (
                  <div className="lp-fcontact">
                    <div className="lp-fci"><Phone size={13} aria-hidden="true" /> +7 (495) 800-00-00</div>
                    <div className="lp-fci"><Mail size={13} aria-hidden="true" /> hello@matercare.ru</div>
                    <div className="lp-fci"><MapPin size={13} aria-hidden="true" /> Москва, ул. Садовая, 15</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="lp-fbt">
            <span>© 2025 MaterCare. Все права защищены.</span>
            <div className="lp-fbt-l">
              <a href="#">Политика конфиденциальности</a>
              <a href="#">Публичная оферта</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
