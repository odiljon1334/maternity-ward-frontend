# MaternityCare UI primitives

Bu papka sahifalardagi boshqaruv elementlari uchun yagona manba hisoblanadi.

## Asosiy qoidalar

- Ranglarni komponent ichida takrorlamang; `app/globals.css` dagi semantic tokenlardan foydalaning.
- Form elementlari uchun `Field`, `Input`, `Select` va `Textarea` ishlating.
- Amallar uchun `Button` variantlaridan foydalaning. So'rov davomida `loading` bering.
- Kontent bloklari uchun `Surface`, katta jadvallar uchun `TableShell` ishlating.
- Yuklanish, bo'sh natija va xato uchun `StatePanel` ishlating.
- Brauzerning `confirm` va `prompt` oynalari o'rniga `ConfirmDialog` va `PromptDialog` ishlating.
- Dashboard sahifalarida imperative tasdiq kerak bo'lsa `useConfirmation()` orqali `confirm()` yoki `prompt()` chaqiring; provider dialog holatini va Promise natijasini boshqaradi.

## Responsive talablar

- Formlar avval bitta ustun, `sm` dan boshlab kerakli ustunlarga o'tadi.
- Katta jadval `TableShell` ichida gorizontal va vertikal scroll bilan qoladi.
- Modal mobil ekranda bottom sheet, katta ekranda markaziy dialog bo'ladi.
- Icon-only tugmada doim `aria-label` bo'lishi kerak.

## Rang tokenlari

`--bg-primary`, `--bg-card`, `--bg-control`, `--border`, `--border-strong`,
`--text-primary`, `--text-secondary`, `--text-muted`, `--focus-ring`,
`--danger`, `--warning` va `--success` light/dark rejimlarda bir xil ma'noni saqlaydi.
